import {exec} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {Logger} from '../../common/logger/interfaces/logger.interface';
import {GenerateCommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {GenerateCommandOptions} from '../../common/program/interfaces/command.options.interface';
import {ColorService} from '../../core/logger/color.service';
import {LoggerService} from '../../core/logger/logger.service';
import {nestWords} from '../../core/utils/nest-ascii';
import osName = require('os-name');

export class InfoCommandHandler implements CommandHandler {
  private logger: Logger;

  public async execute(args: GenerateCommandArguments, options: GenerateCommandOptions, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    this.logger = logger;
    logger.debug(ColorService.blue('[DEBUG]'), 'execute serve command');
    const nodeVersion = process.version + ' ' + ((<any>process).release.lts || '');
    const nestVersion = await this.getNestVersion();
    const cliVersion = await this.getCliVersion();
    const npmVersion = await this.getNpmVersion();
    logger.info(ColorService.yellow(nestWords));
    logger.info(ColorService.green('[System Information]'));
    logger.info(this.concatenate('OS Version', osName()));
    logger.info(this.concatenate('NodeJS Version', nodeVersion));
    logger.info(this.concatenate('NPM Version', npmVersion));
    logger.info(ColorService.green('[Nest Information]'));
    logger.info(this.concatenate('NestJS Version', nestVersion));
    logger.info(this.concatenate('Nest CLI Version', cliVersion));
    logger.info('');
  }

  private concatenate(property: string, value: string): string {
    return `${ property } ${ ColorService.blue(value) }`;
  }

  private async getNestVersion(): Promise<string> {
    return await this._getVersionOf(path.join(process.cwd(), 'node_modules/@nestjs/core/package.json'));
  }

  private async getCliVersion(): Promise<string> {
    return await this._getVersionOf(path.resolve('./package.json'));
  }

  private getNpmVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = exec('npm -v');
      child.stdout.on('data', (data) => resolve(data.toString()));
      child.stderr.on('error', (err) =>
        this.logger.error(ColorService.red('[ERROR]'), 'There was an error reading the current NPM version.')
      );
    });
  }

  private _getVersionOf(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf-8', (err, data) => {
        if (err !== undefined && err !== null) {
          this.logger.error(ColorService.red('[ERROR]'), 'There was an error reading package.json.');
          return reject(err);
        }
        const p = JSON.parse(data);
        if (p && p.version) {
          return resolve(p.version);
        } else {
          this.logger.error(ColorService.red('[ERROR]'), 'This project does not depend on @nestjs/core. That is an error.');
          return reject();
        }
      });
    });
  }
}
