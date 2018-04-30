import { readdir } from 'fs';
import { PackageManager } from './package-manager';
import { AbstractPackageManager } from './abstract.package-manager';
import { NpmPackageManager } from './npm.package-manager';
import { YarnPackageManager } from './yarn.package-manager';

export class PackageManagerFactory {
  public static create(name, logger): AbstractPackageManager {
    switch (name) {
      case PackageManager.NPM:
        return new NpmPackageManager(logger);
      case PackageManager.YARN:
        return new YarnPackageManager(logger);
    }
  }

  public static async find(logger): Promise<AbstractPackageManager> {
    return new Promise<AbstractPackageManager>((resolve) => {
      readdir(process.cwd(), (error, files) => {
        if (error) {
          resolve(this.create(PackageManager.NPM, logger));
        } else {
          if (files.findIndex((filename) => filename === 'yarn.lock') > -1) {
            resolve(this.create(PackageManager.YARN, logger))
          } else {
            resolve(this.create(PackageManager.NPM, logger));
          }
        }
      });
    });
  }
}
