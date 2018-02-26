import { nestWords } from './nest-ascii';
import osName = require('os-name');
import * as fs from 'fs';
import { exec } from 'child_process';
import * as path from 'path';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';

export class InfoHandler {
  constructor(private logger: Logger = LoggerService.getLogger()) {}

  public async handle() {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'execute info command');
    this.logger.info(ColorService.yellow(nestWords));
    await this.displaySystemInformation();
    await this.displayNestInformation();
  }

  public async displaySystemInformation() {
    const nodeVersion = process.version + ' ' + ((<any>process).release.lts || '');
    const npmVersion = await this.getNpmVersion();
    this.logger.info(ColorService.green('[System Information]'));
    this.logger.info(this.format('OS Version', osName()));
    this.logger.info(this.format('NodeJS Version', nodeVersion));
    this.logger.info(this.format('NPM Version', npmVersion));
  }

  public async displayNestInformation() {
    const cliVersion = await this.getCliVersion();
    const nestVersion = await this.getNestVersion();
    this.logger.info(ColorService.green('[Nest Information]'));
    this.logger.info(this.format('NestJS Version', nestVersion));
    this.logger.info(this.format('Nest CLI Version', cliVersion));
  }

  private getNpmVersion(): Promise<string> {
    return new Promise((resolve) => {
      const child = exec('npm -v');
      child.stdout.on('data', (data) => resolve(data.toString()));
      child.stderr.on('error', (err) =>
        this.logger.error(ColorService.red('[ERROR]'), 'There was an error reading the current NPM version.')
      );
    });
  }

  private async getNestVersion(): Promise<string> {
    return await this.getVersionFrom(path.join(process.cwd(), 'node_modules/@nestjs/core/package.json'));
  }

  private async getCliVersion(): Promise<string> {
    return await this.getVersionFrom(path.resolve('./package.json'));
  }

  private getVersionFrom(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf-8', (error, data) => {
        if (error !== undefined && error !== null) {
          this.logger.error(ColorService.red('[ERROR]'), 'There was an error reading package.json.');
          return reject(error);
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

  private format(property: string, value: string): string {
    return `${ property } ${ ColorService.blue(value) }`;
  }
}
