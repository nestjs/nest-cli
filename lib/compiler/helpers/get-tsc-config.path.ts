import { Input } from '../../../commands';
import { Configuration, TscBuilderOptions } from '../../configuration';
import { getDefaultTsconfigPath } from '../../utils/get-default-tsconfig-path';
import { getValueOrDefault } from './get-value-or-default';

/**
 * Returns the path to the tsc configuration file to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The path to the tsc configuration file to use.
 */
export function getTscConfigPath(
  configuration: Required<Configuration>,
  cmdOptions: Input[],
  appName: string,
) {
  let tsconfigPath = getValueOrDefault<string | undefined>(
    configuration,
    'compilerOptions.tsConfigPath',
    appName,
    'path',
    cmdOptions,
  );
  if (tsconfigPath) {
    return tsconfigPath;
  }

  tsconfigPath = getValueOrDefault<TscBuilderOptions['configPath']>(
    configuration,
    'compilerOptions.builder.options.configPath',
    appName,
  );

  return tsconfigPath ?? getDefaultTsconfigPath();
}
