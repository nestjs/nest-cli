import { cyan } from 'ansis';
import { fork } from 'child_process';
import * as chokidar from 'chokidar';
import { readFileSync } from 'fs';
import { stat } from 'fs/promises';
import * as path from 'path';
import { isAbsolute, join } from 'path';
import * as ts from 'typescript';
import { Configuration } from '../../configuration';
import { ERROR_PREFIX } from '../../ui';
import { treeKillSync } from '../../utils/tree-kill';
import { AssetsManager } from '../assets-manager';
import { BaseCompiler } from '../base-compiler';
import { swcDefaultsFactory } from '../defaults/swc-defaults';
import { getValueOrDefault } from '../helpers/get-value-or-default';
import { PluginMetadataGenerator } from '../plugins/plugin-metadata-generator';
import { PluginsLoader } from '../plugins/plugins-loader';
import {
  FOUND_NO_ISSUES_GENERATING_METADATA,
  FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED,
  SWC_LOG_PREFIX,
} from './constants';
import { TypeCheckerHost } from './type-checker-host';

export type SwcCompilerExtras = {
  watch: boolean;
  typeCheck: boolean;
  assetsManager: AssetsManager;
  tsOptions: ts.CompilerOptions;
};

export class SwcCompiler extends BaseCompiler {
  private readonly pluginMetadataGenerator = new PluginMetadataGenerator();
  private readonly typeCheckerHost = new TypeCheckerHost();
  private isFirstRun = true;

  constructor(pluginsLoader: PluginsLoader) {
    super(pluginsLoader);
  }

  public async run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: SwcCompilerExtras,
    onSuccess?: () => void,
  ) {
    const swcOptions = swcDefaultsFactory(extras.tsOptions, configuration);
    const swcrcFilePath = getValueOrDefault<string | undefined>(
      configuration,
      'compilerOptions.builder.options.swcrcPath',
      appName,
    );

    if (extras.watch) {
      if (extras.typeCheck) {
        this.runTypeChecker(configuration, tsConfigPath, appName, extras);
      }
      await this.runSwc(swcOptions, extras, swcrcFilePath);

      if (onSuccess) {
        onSuccess();
        const callback = () => {
          if (!this.isFirstRun) {
            onSuccess();
            return;
          }
          this.isFirstRun = false;
          onSuccess();
        };
        const debounceTime = 150;
        const debouncedCallback = this.debounce(callback, debounceTime);
        this.watchFilesInOutDir(swcOptions, debouncedCallback);
      }
    } else {
      if (extras.typeCheck) {
        await this.runTypeChecker(configuration, tsConfigPath, appName, extras);
      }
      await this.runSwc(swcOptions, extras, swcrcFilePath);
      if (onSuccess) {
        onSuccess();
      }

      extras.assetsManager?.closeWatchers();
    }
  }

  private runTypeChecker(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: SwcCompilerExtras,
  ) {
    if (extras.watch) {
      const args = [
        tsConfigPath,
        appName ?? 'undefined',
        configuration.sourceRoot ?? 'src',
        JSON.stringify(configuration.compilerOptions.plugins ?? []),
      ];

      const childProcessRef = fork(
        join(__dirname, 'forked-type-checker.js'),
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

  private async runSwc(
    options: ReturnType<typeof swcDefaultsFactory>,
    extras: SwcCompilerExtras,
    swcrcFilePath?: string,
  ) {
    process.nextTick(() => console.log(SWC_LOG_PREFIX, cyan('Running...')));

    const swcCli = this.loadSwcCliBinary();
    const swcRcFile = await this.getSwcRcFileContentIfExists(swcrcFilePath);
    const swcOptions = this.deepMerge(options.swcOptions, swcRcFile);

    if (swcOptions?.jsc?.baseUrl && !isAbsolute(swcOptions?.jsc?.baseUrl)) {
      // jsc.baseUrl should be resolved by the caller, if it's passed as an object.
      // https://github.com/swc-project/swc/pull/7827
      const rootDir = process.cwd();
      swcOptions.jsc.baseUrl = path.join(rootDir, swcOptions.jsc.baseUrl);
    }

    const swcCliOpts = {
      ...options,
      swcOptions,
      cliOptions: {
        ...options.cliOptions,
        watch: extras.watch,
      },
    };

    if (extras.watch) {
      // This is required since SWC no longer supports auto-compiling of newly added files in watch mode.
      // We need to watch the source directory and trigger SWC compilation manually.
      await this.watchFilesInSrcDir(options, async (file) => {
        // Transpile newly added file
        await swcCli.default({
          ...swcCliOpts,
          cliOptions: {
            ...swcCliOpts.cliOptions,
            filenames: [file],
          },
        });
      });
    }
    await swcCli.default(swcCliOpts);
  }

  private loadSwcCliBinary() {
    try {
      return require('@swc/cli/lib/swc/dir');
    } catch (err) {
      console.error(
        ERROR_PREFIX +
          ' Failed to load "@swc/cli" and/or "@swc/core" required packages. Please, make sure to install them as development dependencies.',
      );
      process.exit(1);
    }
  }

  private getSwcRcFileContentIfExists(swcrcFilePath?: string) {
    try {
      return JSON.parse(
        readFileSync(join(process.cwd(), swcrcFilePath ?? '.swcrc'), 'utf8'),
      );
    } catch (err) {
      if (swcrcFilePath !== undefined) {
        console.error(
          ERROR_PREFIX +
            ` Failed to load "${swcrcFilePath}". Please, check if the file exists and is valid JSON.`,
        );
        process.exit(1);
      }
      return {};
    }
  }

  private deepMerge<T>(target: T, source: T): T {
    if (
      typeof target !== 'object' ||
      target === null ||
      typeof source !== 'object' ||
      source === null
    ) {
      return source;
    }

    if (Array.isArray(target) && Array.isArray(source)) {
      return source.reduce((acc, value, index) => {
        acc[index] = this.deepMerge(target[index], value);
        return acc;
      }, target);
    }

    const merged = { ...target };
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (key in target) {
          merged[key] = this.deepMerge(target[key], source[key]);
        } else {
          merged[key] = source[key];
        }
      }
    }
    return merged;
  }

  private debounce(callback: () => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(callback, wait);
    };
  }

  private async watchFilesInSrcDir(
    options: ReturnType<typeof swcDefaultsFactory>,
    onFileAdded: (file: string) => Promise<unknown>,
  ) {
    const srcDir = options.cliOptions?.filenames?.[0];
    const isDirectory = await stat(srcDir)
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    if (!srcDir || !isDirectory) {
      // Skip watching if source directory is not a default "src" folder
      // or any other specified directory
      return;
    }
    const extensions = options.cliOptions?.extensions ?? ['ts'];
    const watcher = chokidar.watch(srcDir, {
      ignored: (file, stats) =>
        (stats?.isFile() &&
          extensions.includes(path.extname(file).slice(1))) as boolean,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });
    watcher.on('add', async (file) => onFileAdded(file));
  }

  private watchFilesInOutDir(
    options: ReturnType<typeof swcDefaultsFactory>,
    onChange: () => void,
  ) {
    const compilationEndTime = Date.now();
    const dir = isAbsolute(options.cliOptions.outDir!)
      ? options.cliOptions.outDir!
      : join(process.cwd(), options.cliOptions.outDir!);
    const watcher = chokidar.watch(dir, {
      ignored: (file, stats) =>
        (stats?.isFile() &&
          !(file.endsWith('.js') || file.endsWith('.mjs'))) as boolean,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    for (const eventType of ['add', 'change'] as const) {
      watcher.on(eventType, (filePath, stats) => {
        if (this.isFirstRun) {
          if (
            !compilationEndTime ||
            (stats && stats.mtimeMs > compilationEndTime) ||
            !stats
          ) {
            onChange();
          } else if (!stats && compilationEndTime) {
            stat(filePath)
              .then((fileStats) => {
                if (fileStats.mtimeMs > compilationEndTime) {
                  onChange();
                }
              })
              .catch((err) => {
                console.error(`Error watching file ${filePath}:`, err);
              });
          }
        } else {
          onChange();
        }
      });
    }
  }
}
