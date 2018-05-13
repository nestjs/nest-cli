import { readdir } from 'fs';
import { PackageManager } from './package-manager';
import { AbstractPackageManager } from './abstract.package-manager';
import { NpmPackageManager } from './npm.package-manager';
import { YarnPackageManager } from './yarn.package-manager';

export class PackageManagerFactory {
  public static create(name: PackageManager | string): AbstractPackageManager {
    switch (name) {
      case PackageManager.NPM:
        return new NpmPackageManager();
      case PackageManager.YARN:
        return new YarnPackageManager();
    }
  }

  public static async find(): Promise<AbstractPackageManager> {
    return new Promise<AbstractPackageManager>((resolve) => {
      readdir(process.cwd(), (error, files) => {
        if (error) {
          resolve(this.create(PackageManager.NPM));
        } else {
          if (files.findIndex((filename) => filename === 'yarn.lock') > -1) {
            resolve(this.create(PackageManager.YARN))
          } else {
            resolve(this.create(PackageManager.NPM));
          }
        }
      });
    });
  }
}
