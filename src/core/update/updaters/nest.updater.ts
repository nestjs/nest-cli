import {Updater} from '../../../common/project/interfaces/updater.interface';
import {NpmUtils} from '../../utils/npm.utils';
import {ColorService} from '../../logger/color.service';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {LoggerService} from '../../logger/logger.service';

export class NestUpdater implements Updater {
  private _logger: Logger = LoggerService.getLogger();
  private NEST_DEPENDENCIES: string[] = [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/microservices',
    '@nestjs/testing',
    '@nestjs/websockets'
  ];

  constructor() {}

  public update(): Promise<void> {
    this._logger.info(ColorService.green('updating'), 'Nest dependencies...');
    this._logger.debug(ColorService.blue('[DEBUG]'), 'uninstalling Nest dependencies...');
    return NpmUtils.uninstall('', this.NEST_DEPENDENCIES)
      .then(() => this._logger.debug(ColorService.blue('[DEBUG]'), 'uninstall Nest dependencies success'))
      .then(() => this._logger.debug(ColorService.blue('[DEBUG]'), 'installing Nest dependencies...'))
      .then(() => NpmUtils.install('', this.NEST_DEPENDENCIES))
      .then(() => this._logger.debug(ColorService.blue('[DEBUG]'), 'install Nest dependencies success'))
      .then(() => this._logger.info(ColorService.green('update'), 'Nest dependencies success'));
  }
}
