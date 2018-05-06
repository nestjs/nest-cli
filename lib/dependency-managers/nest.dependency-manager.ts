import { readFile } from 'fs';
import { join } from 'path';

import { AbstractPackageManager, ProjectDependency } from '../package-managers';

export class NestDependencyManager {
  constructor(private packageManager: AbstractPackageManager) {}
  
  public async read(): Promise<string[]> {
    const dependencies: string[] = [];
    const production: ProjectDependency[] = await this.packageManager.getProduction();
    return production
      .filter((dependency) => dependency.name.indexOf('@nestjs') > -1)
      .map((dependency) => dependency.name);
  }

  public async update(force: boolean, tag: string) {
    const dependencies: string[] = await this.read();
    if (force) {
      await this.packageManager.upgradeProduction(dependencies, tag !== undefined ? tag : 'latest');
    } else {
      await this.packageManager.updateProduction(dependencies);
    }
  }
}
