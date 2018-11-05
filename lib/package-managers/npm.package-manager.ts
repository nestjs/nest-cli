import { Runner, RunnerFactory } from '../runners';
import { NpmRunner } from '../runners/npm.runner';
import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManager } from './package-manager';
import {PackageManagerCommands} from './package-manager-commands';
import {ProjectDependency} from './project.dependency';
import {readFile} from "fs";
import {join} from "path";

export class NpmPackageManager extends AbstractPackageManager {
  constructor() {
    super(RunnerFactory.create(Runner.NPM) as NpmRunner);
  }

  public get name() {
    return PackageManager.NPM.toUpperCase();
  }

  get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'install',
      update: 'update',
      remove: 'uninstall',
      saveFlag: '--save',
      saveDevFlag: '--save-dev',
    };
  }

  public async getInstalledDependencies(): Promise<ProjectDependency[]> {
    return new Promise<ProjectDependency[]>((resolve, reject)  => {
      readFile(join(process.cwd(), 'package-lock.json'), (error: NodeJS.ErrnoException, buffer: Buffer) => {
        if (error !== undefined && error !== null) {
          reject(error);
      } else {
        const json = JSON.parse(buffer.toString()).dependencies;
        const dependencies: ProjectDependency[] = [];
        Object.keys(json).forEach((key) => dependencies.push({
            name: key,
            version: json[key].version,
          }),
        );
        resolve(dependencies);
        }
      });
    }).catch(() => this.getProduction());
  }

}
