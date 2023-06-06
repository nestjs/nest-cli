import { Configuration } from '../../configuration';
import { ERROR_PREFIX } from '../../ui';
import { BaseCompiler } from '../base-compiler';
import { PluginMetadataGenerator } from '../plugins/plugin-metadata-generator';
import { PluginsLoader } from '../plugins/plugins-loader';
import {
  FOUND_NO_ISSUES_GENERATING_METADATA,
  FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED,
} from './constants';
import { SwcCompilerExtras } from './swc-compiler';
import { TypeCheckerHost } from './type-checker-host';

const [tsConfigPath, appName, sourceRoot, plugins] = process.argv.slice(2);

class ForkedTypeChecker extends BaseCompiler {
  private readonly pluginMetadataGenerator = new PluginMetadataGenerator();
  private readonly typeCheckerHost = new TypeCheckerHost();

  public async run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: SwcCompilerExtras,
  ) {
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

    try {
      this.typeCheckerHost.run(tsConfigPath, {
        watch: extras.watch,
        onSuccess: (program) => {
          if (readonlyVisitors.length > 0) {
            console.log(FOUND_NO_ISSUES_GENERATING_METADATA);

            this.pluginMetadataGenerator.generate({
              outputDir,
              visitors: readonlyVisitors,
              tsProgramRef: program,
            });
          } else {
            console.log(FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED);
          }
        },
      });
    } catch (err) {
      console.log(ERROR_PREFIX, err.message);
    }
  }
}

const pluginsLoader = new PluginsLoader();
const forkedTypeChecker = new ForkedTypeChecker(pluginsLoader);
const applicationName = appName === 'undefined' ? '' : appName;
const options: Partial<Configuration> = {
  sourceRoot,
};

if (applicationName) {
  options.projects = {};
  options.projects[applicationName] = {
    compilerOptions: {
      plugins: JSON.parse(plugins),
    },
  };
} else {
  options.compilerOptions = {
    plugins: JSON.parse(plugins),
  };
}

forkedTypeChecker.run(
  options as unknown as Required<Configuration>,
  tsConfigPath,
  applicationName,
  { watch: true, typeCheck: true },
);
