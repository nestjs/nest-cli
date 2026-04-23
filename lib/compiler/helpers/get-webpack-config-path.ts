import { Builder, Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';

/**
 * Returns the path to the webpack configuration file to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The path to the webpack configuration file to use.
 */
export function getWebpackConfigPath(
  configuration: Required<Configuration>,
  cmdOptions: Record<string, any>,
  appName: string | undefined,
) {
  let webpackPath = getValueOrDefault<string | undefined>(
    configuration,
    'compilerOptions.webpackConfigPath',
    appName,
    'webpackPath',
    cmdOptions,
  );
  if (webpackPath) {
    return webpackPath;
  }

  const builder = getValueOrDefault<Builder>(
    configuration,
    'compilerOptions.builder',
    appName,
  );

  if (typeof builder === 'object' && builder?.type === 'webpack') {
    const webpackConfigPath = builder.options?.configPath;
    if (webpackConfigPath) {
      return webpackConfigPath;
    }
    // If builder.type is 'webpack' but no config path is specified, return undefined
    // to let webpack use its default behavior
    return undefined;
  }
  return undefined;
}
