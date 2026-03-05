import { rm } from 'fs/promises';
import { Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';

export async function deleteOutDirIfEnabled(
  configuration: Required<Configuration>,
  appName: string | undefined,
  dirPath: string,
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
}
