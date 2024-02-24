import { rm } from 'fs/promises';
import { Configuration } from '../../configuration';
import { getValueOrDefault } from './get-value-or-default';

export async function deleteOutDirIfEnabled(
  configuration: Required<Configuration>,
  appName: string,
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
