import * as ora from 'ora';
import { AbstractPackageManager, ProjectDependency } from '../package-managers';
import { messages } from '../ui';

export class NestDependencyManager {
  constructor(private packageManager: AbstractPackageManager) {}

  public async read(): Promise<string[]> {
    const dependencies: string[] = [];
    const production: ProjectDependency[] = await this.packageManager.getProduction();
    return production.filter(dependency => dependency.name.indexOf('@nestjs') > -1).map(dependency => dependency.name);
  }

  public async update(force: boolean, tag: string) {
    const spinner = ora({
      spinner: {
        interval: 120,
        frames: ['▹▹▹▹▹', '▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸'],
      },
      text: messages.PACKAGE_MANAGER_UPDATE_IN_PROGRESS,
    });
    spinner.start();
    const dependencies: string[] = await this.read();
    if (force) {
      await this.packageManager.upgradeProduction(dependencies, tag !== undefined ? tag : 'latest');
    } else {
      await this.packageManager.updateProduction(dependencies);
    }
    spinner.succeed();
  }
}
