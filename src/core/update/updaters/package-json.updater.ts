import {NpmUtils} from '../../utils/npm.utils';
import {Updater} from '../../../common/project/interfaces/updater.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {LoggerService} from '../../../logger/logger.service';
import {ColorService} from '../../../logger/color.service';

interface PackageJson {
  devDependencies: { [key: string ]: string }
}

export class PackageJsonUpdater implements Updater {
  private _logger: Logger = LoggerService.getLogger();

  constructor() {}

  public update(): Promise<void> {
    this._logger.info(ColorService.green('updating'), 'package.json dev dependencies...');
    this._logger.debug(ColorService.blue('[DEBUG]'), 'reading package.json...');
    return FileSystemUtils.readFile(path.join(process.cwd(), 'package.json'))
      .then(content => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'read package.json success content : ', content);
        this._logger.debug(ColorService.blue('[DEBUG]'), 'parsing  package.json content...');
        return JSON.parse(content);
      })
      .then((file: PackageJson) => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'parse package.json content success : ', JSON.stringify(file, null, 2));
        this._logger.debug(ColorService.blue('[DEBUG]'), 'extracting devDependencies...');
        return file.devDependencies;
      })
      .then(devDependencies => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'extract devDependencies success : ', JSON.stringify(devDependencies, null, 2));
        this._logger.debug(ColorService.blue('[DEBUG]'), 'extracting devDependencies module names...');
        return Object.keys(devDependencies);
      })
      .then(devDependencyNames => {
        this._logger.debug(ColorService.blue('[DEBUG]'), 'extract devDependencies module names success : ', devDependencyNames);
        this._logger.debug(ColorService.blue('[DEBUG]'), 'updating devDependencies...');
        this._logger.debug(ColorService.blue('[DEBUG]'), 'uninstalling devDependencies...');
        return NpmUtils.uninstall('-dev', devDependencyNames)
          .then(() => this._logger.debug(ColorService.blue('[DEBUG]'), 'uninstalling devDependencies success'))
          .then(() => this._logger.debug(ColorService.blue('[DEBUG]'), 'installing devDependencies...'))
          .then(() => NpmUtils.install('-dev', devDependencyNames))
          .then(() => this._logger.debug(ColorService.blue('[DEBUG]'), 'install devDependencies success'))
          .then(() => this._logger.info(ColorService.green('update'), 'package.json dev dependencies success'));
      });
  }
}
