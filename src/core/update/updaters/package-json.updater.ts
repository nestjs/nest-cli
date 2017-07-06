import {NpmUtils} from '../../utils/npm.utils';
import {Updater} from '../../../common/project/interfaces/updater.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {LoggerService} from '../../logger/logger.service';
import {ColorService} from '../../logger/color.service';

interface PackageJson {
  devDependencies: { [key: string ]: string }
}

export class PackageJsonUpdater implements Updater {
  private _logger: Logger = LoggerService.getLogger();

  constructor() {}

  public update(): Promise<void> {
    this._logger.debug(ColorService.blue('[DEBUG]'), 'update package.json dependencies');
    return FileSystemUtils.readFile(path.join(process.cwd(), 'package.json'))
      .then(content => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'read package.json content : ', content);
        return JSON.parse(content);
      })
      .then((file: PackageJson) => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'parse package.json : ', JSON.stringify(file, null, 2));
        return file.devDependencies;
      })
      .then(devDependencies => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'extract dev dependencies : ', JSON.stringify(devDependencies, null, 2));
        return Object.keys(devDependencies);
      })
      .then(devDependencyNames => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'update dev dependencies : ', devDependencyNames);
        return NpmUtils.uninstall('-dev', devDependencyNames)
          .then(() => NpmUtils.install('-dev', devDependencyNames));
      });
  }
}
