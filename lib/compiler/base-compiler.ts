import { fork } from 'child_process';
import { dirname, join, normalize, relative } from 'path';
import { fileURLToPath } from 'url';
import { Configuration } from '../configuration/index.js';
import { treeKillSync } from '../utils/tree-kill.js';
import { getValueOrDefault } from './helpers/get-value-or-default.js';
import { PluginMetadataGenerator } from './plugins/plugin-metadata-generator.js';
import { PluginsLoader } from './plugins/plugins-loader.js';
import {
  FOUND_NO_ISSUES_GENERATING_METADATA,
  FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED,
} from './swc/constants.js';
import { TypeCheckerHost } from './swc/type-checker-host.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export abstract class BaseCompiler<T = Record<string, any>> {
  protected readonly pluginMetadataGenerator = new PluginMetadataGenerator();
  protected readonly typeCheckerHost = new TypeCheckerHost();

  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public abstract run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras?: T,
    onSuccess?: () => void,
  ): void | Promise<void>;

  protected loadPlugins(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
  ) {
    const pluginsConfig = getValueOrDefault(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    const pathToSource = this.getPathToSource(
      configuration,
      tsConfigPath,
      appName,
    );

    const plugins = this.pluginsLoader.load(pluginsConfig, { pathToSource });
    return plugins;
  }

  protected getPathToSource(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
  ) {
    const sourceRoot = getValueOrDefault<string>(
      configuration,
      'sourceRoot',
      appName,
      'sourceRoot',
    );
    const cwd = process.cwd();
    const relativeRootPath = dirname(relative(cwd, tsConfigPath));
    const pathToSource =
      normalize(sourceRoot).indexOf(normalize(relativeRootPath)) >= 0
        ? join(cwd, sourceRoot)
        : join(cwd, relativeRootPath, sourceRoot);

    return pathToSource;
  }

  protected runTypeChecker(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: { watch?: boolean; typeCheck?: boolean },
  ) {
    if (extras.watch) {
      const args = [
        tsConfigPath,
        appName ?? 'undefined',
        // The forked checker resolves its plugin metadata output directory
        // from this value, so it has to be the built application's source
        // root, not the monorepo's default project one.
        getValueOrDefault<string | undefined>(
          configuration,
          'sourceRoot',
          appName,
          'sourceRoot',
        ) ?? 'src',
        // Same for the plugins: a monorepo application can declare its own
        // "compilerOptions.plugins", and the non-watch path loads them per
        // application through loadPlugins().
        JSON.stringify(
          getValueOrDefault(
            configuration,
            'compilerOptions.plugins',
            appName,
          ) ?? [],
        ),
      ];

      const childProcessRef = fork(
        join(__dirname, 'swc/forked-type-checker.js'),
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
            onProgramInit:
              readonlyVisitors.length > 0
                ? (program) =>
                    this.pluginMetadataGenerator.generate({
                      outputDir,
                      visitors: readonlyVisitors,
                      tsProgramRef: program,
                    })
                : undefined,
            onTypeCheck: () => {
              if (!fulfilled) {
                fulfilled = true;
                resolve();
              }
              if (readonlyVisitors.length > 0) {
                process.nextTick(() =>
                  console.log(FOUND_NO_ISSUES_GENERATING_METADATA),
                );
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
}
