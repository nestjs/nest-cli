import { Builder, Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';

/**
 * Returns the path to the rspack configuration file to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The path to the rspack configuration file to use.
 */
export function getRspackConfigPath(
  configuration: Required<Configuration>,
  cmdOptions: Record<string, any>,
  appName: string | undefined,
) {
  const builder = getValueOrDefault<Builder>(
    configuration,
    'compilerOptions.builder',
    appName,
  );

  const rspackPath =
    typeof builder === 'object' && builder?.type === 'rspack'
      ? builder.options?.configPath
      : undefined;
  return rspackPath;
}
