import { cyan } from 'ansis';
import { fork } from 'child_process';
import * as chokidar from 'chokidar';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { stat } from 'fs/promises';
import { sync } from 'glob';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'path';
import * as ts from 'typescript';
import { Configuration } from '../../configuration';
import { ERROR_PREFIX } from '../../ui';
import { treeKillSync } from '../../utils/tree-kill';
import { AssetsManager } from '../assets-manager';
import { BaseCompiler } from '../base-compiler';
import { oxcDefaultsFactory } from '../defaults/oxc-defaults';
import { PluginMetadataGenerator } from '../plugins/plugin-metadata-generator';
import { PluginsLoader } from '../plugins/plugins-loader';
import {
  FOUND_NO_ISSUES_GENERATING_METADATA,
  FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED,
} from '../swc/constants';
import { TypeCheckerHost } from '../swc/type-checker-host';
import { OXC_LOG_PREFIX } from './constants';

export type OxcCompilerExtras = {
  watch: boolean;
  typeCheck: boolean;
  assetsManager: AssetsManager;
  tsOptions: ts.CompilerOptions;
};

type OxcTransformResult = {
  code: string;
  map?: unknown;
  declaration?: string;
  declarationMap?: unknown;
  errors: Array<{
    message: string;
    codeframe?: string | null;
  }>;
};

type OxcTransform = {
  transform: (
    filename: string,
    sourceText: string,
    options?: Record<string, any>,
  ) => Promise<OxcTransformResult> | OxcTransformResult;
};

type OxcOptions = ReturnType<typeof oxcDefaultsFactory>;

export class OxcCompiler extends BaseCompiler {
  private readonly pluginMetadataGenerator = new PluginMetadataGenerator();
  private readonly typeCheckerHost = new TypeCheckerHost();

  constructor(pluginsLoader: PluginsLoader) {
    super(pluginsLoader);
  }

  public async run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: OxcCompilerExtras,
    onSuccess?: () => void,
  ) {
    const oxcOptions = oxcDefaultsFactory(extras.tsOptions, configuration);

    if (extras.watch) {
      if (extras.typeCheck) {
        this.runTypeChecker(configuration, tsConfigPath, appName, extras);
      }
      await this.runOxc(oxcOptions, extras);

      if (onSuccess) {
        onSuccess();

        const debounceTime = 150;
        const callback = this.debounce(onSuccess, debounceTime);
        await this.watchFilesInSrcDir(oxcOptions, async (file, action) => {
          if (action === 'unlink') {
            this.removeCompiledFile(file, oxcOptions);
          } else {
            await this.transpileFile(file, oxcOptions);
          }
          callback();
        });
      }
    } else {
      if (extras.typeCheck) {
        await this.runTypeChecker(configuration, tsConfigPath, appName, extras);
      }
      await this.runOxc(oxcOptions, extras);
      if (onSuccess) {
        onSuccess();
      }

      await extras.assetsManager?.closeWatchers();
    }
  }

  private runTypeChecker(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: OxcCompilerExtras,
  ) {
    if (extras.watch) {
      const args = [
        tsConfigPath,
        appName ?? 'undefined',
        configuration.sourceRoot ?? 'src',
        JSON.stringify(configuration.compilerOptions.plugins ?? []),
      ];

      const childProcessRef = fork(
        join(__dirname, '../swc/forked-type-checker.js'),
        args,
        {
          cwd: process.cwd(),
        },
      );
      process.on(
        'exit',
        () => childProcessRef && treeKillSync(childProcessRef.pid!),
      );
    } else {
      const { readonlyVisitors } = this.loadPlugins(
        configuration,
        tsConfigPath,
        appName,
      );
      const outputDir = this.getPathToSource(
        configuration,
        tsConfigPath,
        appName,
      );

      let fulfilled = false;
      return new Promise<void>((resolve, reject) => {
        try {
          this.typeCheckerHost.run(tsConfigPath, {
            watch: extras.watch,
            onTypeCheck: (program) => {
              if (!fulfilled) {
                fulfilled = true;
                resolve();
              }
              if (readonlyVisitors.length > 0) {
                process.nextTick(() =>
                  console.log(FOUND_NO_ISSUES_GENERATING_METADATA),
                );

                this.pluginMetadataGenerator.generate({
                  outputDir,
                  visitors: readonlyVisitors,
                  tsProgramRef: program,
                });
              } else {
                process.nextTick(() =>
                  console.log(FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED),
                );
              }
            },
          });
        } catch (err) {
          if (!fulfilled) {
            fulfilled = true;
            reject(err);
          }
        }
      });
    }
  }

  private async runOxc(options: OxcOptions, _extras: OxcCompilerExtras) {
    if (!options.cliOptions.quiet) {
      process.nextTick(() => console.log(OXC_LOG_PREFIX, cyan('Running...')));
    }

    const files = await this.getFilesToCompile(options);
    await Promise.all(files.map((file) => this.transpileFile(file, options)));
  }

  private async loadOxcTransform(): Promise<OxcTransform> {
    try {
      try {
        const oxc = require('oxc-transform');
        return oxc.default ?? oxc;
      } catch {
        // oxc-transform is ESM in supported versions. Keep a native dynamic
        // import fallback for Node versions that cannot require ESM packages.
      }

      const nativeImport = new Function(
        'specifier',
        'return import(specifier)',
      ) as (specifier: string) => Promise<any>;
      const oxc = await nativeImport('oxc-transform');
      return oxc.default ?? oxc;
    } catch (err) {
      console.error(
        ERROR_PREFIX +
          ' Failed to load "oxc-transform" required package. Please, make sure to install both "oxc-transform" and "@oxc-project/runtime" as development dependencies.',
      );
      process.exit(1);
    }
  }

  private async transpileFile(file: string, options: OxcOptions) {
    const oxc = await this.loadOxcTransform();
    const sourceText = readFileSync(file, 'utf8');
    const result = await oxc.transform(file, sourceText, {
      ...options.transformOptions,
      lang: this.getLangByExtension(file),
      typescript: {
        ...options.transformOptions.typescript,
        declaration: options.cliOptions.declaration
          ? { sourcemap: !!options.transformOptions.sourcemap }
          : undefined,
      },
    });

    if (result.errors.length > 0) {
      const message = result.errors
        .map((error) => error.codeframe || error.message)
        .join('\n');
      throw new Error(message);
    }

    const outputPath = this.getOutputPath(file, options, '.js');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(
      outputPath,
      this.withSourceMap(
        result.code,
        result.map,
        options,
        `${basename(outputPath)}.map`,
      ),
    );

    if (result.map && !this.isInlineSourceMap(options)) {
      writeFileSync(`${outputPath}.map`, JSON.stringify(result.map));
    }

    if (result.declaration) {
      const declarationPath = this.getOutputPath(file, options, '.d.ts');
      mkdirSync(dirname(declarationPath), { recursive: true });
      writeFileSync(
        declarationPath,
        this.withSourceMap(
          result.declaration,
          result.declarationMap,
          options,
          `${basename(declarationPath)}.map`,
        ),
      );

      if (result.declarationMap && !this.isInlineSourceMap(options)) {
        writeFileSync(
          `${declarationPath}.map`,
          JSON.stringify(result.declarationMap),
        );
      }
    }
  }

  private async getFilesToCompile(options: OxcOptions) {
    const files = options.cliOptions.filenames.flatMap((filename) => {
      if (!existsSync(filename)) {
        return sync(filename, { dot: true });
      }

      if (existsSync(filename) && !this.isDirectory(filename)) {
        return [filename];
      }

      const directory = filename.replace(/\\/g, '/');
      return sync(`${directory}/**/*`, { dot: true });
    });

    const uniqueFiles = [...new Set(files)];
    const filteredFiles = await Promise.all(
      uniqueFiles.map(async (file) => {
        const isFile = await stat(file)
          .then((stats) => stats.isFile())
          .catch(() => false);
        return isFile && this.isSupportedFile(file, options) ? file : undefined;
      }),
    );

    return filteredFiles.filter(Boolean) as string[];
  }

  private isDirectory(path: string) {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  private async watchFilesInSrcDir(
    options: OxcOptions,
    onChange: (file: string, action: 'add' | 'change' | 'unlink') => unknown,
  ) {
    const srcDir = options.cliOptions?.filenames?.[0];
    const isDirectory = await stat(srcDir)
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    if (!srcDir || !isDirectory) {
      return;
    }

    const watcher = chokidar.watch(srcDir, {
      ignored: (file, stats) =>
        (stats?.isFile() && !this.isSupportedFile(file, options)) as boolean,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    for (const event of ['add', 'change', 'unlink'] as const) {
      watcher.on(event, async (file) => onChange(file, event));
    }
  }

  private removeCompiledFile(file: string, options: OxcOptions) {
    const outputPath = this.getOutputPath(file, options, '.js');
    rmSync(outputPath, { force: true });
    rmSync(`${outputPath}.map`, { force: true });

    const declarationPath = this.getOutputPath(file, options, '.d.ts');
    rmSync(declarationPath, { force: true });
    rmSync(`${declarationPath}.map`, { force: true });
  }

  private getOutputPath(file: string, options: OxcOptions, extension: string) {
    const outDir = isAbsolute(options.cliOptions.outDir!)
      ? options.cliOptions.outDir!
      : join(process.cwd(), options.cliOptions.outDir!);
    const baseDir = this.getBaseDir(file, options);
    const relativePath = relative(baseDir, resolve(process.cwd(), file));
    const parsedExtension = this.getOutputExtension(file, extension);

    return join(
      outDir,
      relativePath.replace(/\.(c|m)?(j|t)sx?$/, parsedExtension),
    );
  }

  private getBaseDir(file: string, options: OxcOptions) {
    if (!options.cliOptions.stripLeadingPaths) {
      return resolve(process.cwd(), options.cliOptions.rootDir || '.');
    }

    const filename = options.cliOptions.filenames.find((item) => {
      const resolved = resolve(process.cwd(), item);
      return resolve(process.cwd(), file).startsWith(resolved);
    });

    return filename ? resolve(process.cwd(), filename) : process.cwd();
  }

  private getOutputExtension(file: string, extension: string) {
    if (extension !== '.js') {
      return extension;
    }

    if (file.endsWith('.mts')) {
      return '.mjs';
    }
    if (file.endsWith('.cts')) {
      return '.cjs';
    }
    return '.js';
  }

  private getLangByExtension(file: string) {
    const extension = extname(file);
    if (extension === '.tsx') {
      return 'tsx';
    }
    if (extension === '.jsx') {
      return 'jsx';
    }
    if (extension === '.ts' || extension === '.mts' || extension === '.cts') {
      return 'ts';
    }
    return 'js';
  }

  private isSupportedFile(file: string, options: OxcOptions) {
    if (file.endsWith('.d.ts')) {
      return false;
    }
    return options.cliOptions.extensions.some((extension) =>
      file.endsWith(extension),
    );
  }

  private withSourceMap(
    code: string,
    map: unknown,
    options: OxcOptions,
    sourceMapFilename: string,
  ) {
    if (!map) {
      return code;
    }

    if (this.isInlineSourceMap(options)) {
      return `${code}\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
        JSON.stringify(map),
      ).toString('base64')}`;
    }

    return `${code}\n//# sourceMappingURL=${sourceMapFilename}`;
  }

  private isInlineSourceMap(options: OxcOptions) {
    return options.cliOptions.inlineSourceMap === true;
  }

  private debounce(callback: () => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(callback, wait);
    };
  }
}
