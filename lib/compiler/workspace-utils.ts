import rimraf from 'rimraf';
import { Configuration } from '../configuration';
import { getValueOrDefault } from './helpers/get-value-or-default';

export class WorkspaceUtils {
  public async deleteOutDirIfEnabled(
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
    await rimraf(dirPath);
  }
}
