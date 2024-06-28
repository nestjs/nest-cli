import * as chalk from 'chalk';
import { fork } from 'child_process';
import * as chokidar from 'chokidar';
import { readFileSync } from 'fs';
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

  constructor(pluginsLoader: PluginsLoader) {
    super(pluginsLoader);
  }

  public async run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string,
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

        const debounceTime = 150;
        const callback = this.debounce(onSuccess, debounceTime);
        this.watchFilesInOutDir(swcOptions, callback);
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
    appName: string,
    extras: SwcCompilerExtras,
  ) {
    if (extras.watch) {
      const args = [
        tsConfigPath,
        appName,
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
    process.nextTick(() =>
      console.log(SWC_LOG_PREFIX, chalk.cyan('Running...')),
    );

    const swcCli = this.loadSwcCliBinary();
    const swcRcFile = await this.getSwcRcFileContentIfExists(swcrcFilePath);
    const swcOptions = this.deepMerge(options.swcOptions, swcRcFile);

    if (swcOptions?.jsc?.baseUrl && !isAbsolute(swcOptions?.jsc?.baseUrl)) {
      // jsc.baseUrl should be resolved by the caller, if it's passed as an object.
      // https://github.com/swc-project/swc/pull/7827
      const rootDir = process.cwd();
      swcOptions.jsc.baseUrl = path.join(rootDir, swcOptions.jsc.baseUrl);
    }

    await swcCli.default({
      ...options,
      swcOptions,
      cliOptions: {
        ...options.cliOptions,
        watch: extras.watch,
      },
    });
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

  private watchFilesInOutDir(
    options: ReturnType<typeof swcDefaultsFactory>,
    onChange: () => void,
  ) {
    const dir = isAbsolute(options.cliOptions.outDir!)
      ? options.cliOptions.outDir!
      : join(process.cwd(), options.cliOptions.outDir!);
    const paths = join(dir, '**/*.js');
    const watcher = chokidar.watch(paths, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });
    for (const type of ['add', 'change']) {
      watcher.on(type, async () => onChange());
    }
  }
}
