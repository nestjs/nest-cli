import { dasherize } from '@angular-devkit/core/src/utils/strings';
import chalk from 'chalk';
import { readFile } from 'fs';
import * as ora from 'ora';
import { join } from 'path';
import { AbstractRunner } from '../runners/abstract.runner';
import { messages } from '../ui';
import { PackageManagerCommands } from './package-manager-commands';
import { ProjectDependency } from './project.dependency';

export abstract class AbstractPackageManager {
  constructor(protected runner: AbstractRunner) {}

  public async install(directory: string) {
    const spinner = ora({
      spinner: {
        interval: 120,
        frames: [
          '▹▹▹▹▹',
          '▸▹▹▹▹',
          '▹▸▹▹▹',
          '▹▹▸▹▹',
          '▹▹▹▸▹',
          '▹▹▹▹▸',
        ],
      },
      text: messages.PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS,
    });
    spinner.start();
    try {
      const commandArguments = `${this.cli.install} --silent`;
      const collect = true;
      const dasherizedDir: string = dasherize(directory);
      await this.runner.run(commandArguments, collect, join(process.cwd(), dasherizedDir));
      spinner.succeed();
      console.info();
      console.info(messages.PACKAGE_MANAGER_INSTALLATION_SUCCEED(directory));
      console.info(messages.GET_STARTED_INFORMATION);
      console.info();
      console.info(chalk.gray(messages.CHANGE_DIR_COMMAND(directory)));
      console.info(chalk.gray(messages.START_COMMAND));
      console.info();
    } catch {
      spinner.fail();
      console.error(chalk.red(messages.PACKAGE_MANAGER_INSTALLATION_FAILED));
    }
  }

  public async version(): Promise<string> {
    const commandArguments = '--version';
    const collect = true;
    return this.runner.run(commandArguments, collect) as Promise<string>;
  }

  public async addProduction(dependencies: string[], tag: string) {
    const command: string = [this.cli.add, this.cli.saveFlag].filter((i) => i).join(' ');
    const args: string = dependencies.map((dependency) => `${ dependency }@${ tag }`).join(' ');
    await this.add(`${ command } ${ args }`);
  }

  public async addDevelopment(dependencies: string[], tag: string) {
    const command: string = `${ this.cli.add } ${ this.cli.saveDevFlag }`;
    const args: string = dependencies.map((dependency) => `${ dependency }@${ tag }`).join(' ');
    await this.add(`${ command } ${ args }`);
  }

  private async add(commandArguments: string) {
    const collect = true;
    await this.runner.run(commandArguments, collect);
  }

  public async getProduction(): Promise<ProjectDependency[]> {
    const packageJsonContent = await this.readPackageJson();
    const packageJsonDependencies: { [key: string]: string } = packageJsonContent.dependencies;
    const dependencies = [];

    for (const [name, version] of Object.entries(packageJsonDependencies)) {
      dependencies.push({ name, version });
    }

    return dependencies;
  }

  public async getDevelopement(): Promise<ProjectDependency[]> {
    const packageJsonContent = await this.readPackageJson();
    const packageJsonDevDependencies: { [key: string]: string } = packageJsonContent.devDependencies;
    const dependencies = [];

    for (const [name, version] of Object.entries(packageJsonDevDependencies)) {
      dependencies.push({ name, version });
    }

    return dependencies;
  }

  private async readPackageJson(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      readFile(join(process.cwd(), 'package.json'), (error: NodeJS.ErrnoException, buffer: Buffer) => {
        if (error !== undefined && error !== null) {
          reject(error);
        } else {
          resolve(JSON.parse(buffer.toString()));
        }
      });
    });
  }

  public async updateProduction(dependencies: string[]) {
    const commandArguments: string = `${this.cli.update} ${ dependencies.join(' ')}`;
    await this.update(commandArguments);
  }

  public async updateDevelopement(dependencies: string[]) {
    const commandArguments: string = `${this.cli.update} ${ dependencies.join(' ')}`;
    await this.update(commandArguments);
  }

  private async update(commandArguments: string) {
    const collect = true;
    await this.runner.run(commandArguments, collect);
  }

  public async upgradeProduction(dependencies: string[], tag: string) {
    await this.deleteProduction(dependencies);
    await this.addProduction(dependencies, tag);
  }

  public async upgradeDevelopement(dependencies: string[], tag: string) {
    await this.deleteDevelopment(dependencies);
    await this.addDevelopment(dependencies, tag);
  }

  public async deleteProduction(dependencies: string[]) {
    const command: string = [ this.cli.remove, this.cli.saveFlag ].filter((i) => i).join(' ');
    const args: string = dependencies.join(' ');
    await this.delete(`${ command } ${ args }`);
  }

  public async deleteDevelopment(dependencies: string[]) {
    const commandArguments: string = `${this.cli.remove} ${this.cli.saveDevFlag} ${ dependencies.join(' ') }`;
    await this.delete(commandArguments);
  }

  public async delete(commandArguments: string) {
    const collect = true;
    await this.runner.run(commandArguments, collect);
  }

  public abstract get name(): string;

  public abstract get cli(): PackageManagerCommands;
}
