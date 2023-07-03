import { Input } from '../../../commands';
import { Builder, Configuration } from '../../configuration';
import { getValueOrDefault } from './get-value-or-default';

/**
 * Returns the path to the webpack configuration file to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The path to the webpack configuration file to use.
 */
export function getWebpackConfigPath(
  configuration: Required<Configuration>,
  cmdOptions: Input[],
  appName: string,
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

  webpackPath =
    typeof builder === 'object' && builder?.type === 'webpack'
      ? builder.options?.configPath
      : undefined;
  return webpackPath;
}
