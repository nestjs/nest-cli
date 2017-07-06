import {Updater} from '../../../common/project/interfaces/updater.interface';
import {NpmUtils} from '../../utils/npm.utils';

export class NestUpdater implements Updater {
  private NEST_DEPENDENCIES: string[] = [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/microservices',
    '@nestjs/testing',
    '@nestjs/websockets'
  ];

  public update(): Promise<void> {
    return NpmUtils.uninstall(this.NEST_DEPENDENCIES)
      .then(() => NpmUtils.install(this.NEST_DEPENDENCIES));
  }
}
