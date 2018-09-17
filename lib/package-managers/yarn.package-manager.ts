// @ts-ignore
import lockfile = require('@yarnpkg/lockfile');
import { readFile } from 'fs';
import { join } from 'path';
import { Runner, RunnerFactory } from '../runners';
import { YarnRunner } from '../runners/yarn.runner';
import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManager } from './package-manager';
import { PackageManagerCommands } from './package-manager-commands';
import { ProjectDependency } from './project.dependency';

export class YarnPackageManager extends AbstractPackageManager {

  constructor() {
    super(RunnerFactory.create(Runner.YARN) as YarnRunner);
  }

  public get name() {
    return PackageManager.YARN.toUpperCase();
  }

  get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'add',
      update: 'upgrade',
      remove: 'remove',
      saveFlag: '',
      saveDevFlag: '-D',
    };
  }

  public async getInstalledDependencies(): Promise<ProjectDependency[]> {
    return new Promise<ProjectDependency[]>((resolve, reject)  => {
      readFile(join(process.cwd(), 'yarn.lock'), (error: NodeJS.ErrnoException, buffer: Buffer) => {
        if (error !== undefined && error !== null) {
          reject(error);
        } else {
          const json: YarnLock = lockfile.parse(buffer.toString());
          if (json.type === 'success') {
            const dependencies: ProjectDependency[] = [];
            Object.keys(json.object).forEach((key) => {
              const value = json.object[key];
              dependencies.push({
                name: key.substring(0, key.lastIndexOf('@')),
                version:  value.version,
              });
            });
            resolve(dependencies);
          } else {
            reject(new Error(`Error during yarn.lock parsing: ${json.type}`));
          }
        }
      });
    });
  }
}

interface YarnLock {
    type: string;
    object: YarnDependencies;
}

interface YarnDependencies {
    [key: string]: YarnDependency;
}

interface YarnDependency {
    version: string;
    resolved: string;
    dependencies: {[key: string]: string};
}
