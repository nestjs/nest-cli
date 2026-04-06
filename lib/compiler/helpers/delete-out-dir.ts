import { rm } from 'fs/promises';
import * as ts from 'typescript';
import { Configuration } from '../../configuration';
import { getValueOrDefault } from './get-value-or-default';

export async function deleteOutDirIfEnabled(
  configuration: Required<Configuration>,
  appName: string | undefined,
  dirPath: string,
  tsOptions?: ts.CompilerOptions,
) {
  const isDeleteEnabled = getValueOrDefault<boolean>(
    configuration,
    'compilerOptions.deleteOutDir',
    appName,
  );
  if (!isDeleteEnabled) {
    return;
  }
  await rm(dirPath, { recursive: true, force: true });
  if (tsOptions?.tsBuildInfoFile) {
    await rm(tsOptions.tsBuildInfoFile, { force: true });
  }
}
