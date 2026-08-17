import { Builder, Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';

/**
 * Returns the builder to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The builder to use.
 */
export function getBuilder(
  configuration: Required<Configuration>,
  cmdOptions: Record<string, any>,
  appName: string | undefined,
) {
  const builderValue = getValueOrDefault<Builder>(
    configuration,
    'compilerOptions.builder',
    appName,
    'builder',
    cmdOptions,
    'tsc',
  );
  return typeof builderValue === 'string'
    ? {
        type: builderValue,
      }
    : builderValue;
}
