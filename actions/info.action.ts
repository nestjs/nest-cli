import * as chalk from 'chalk';
import { readFileSync } from 'fs';
import { platform, release } from 'os';
import osName = require('os-name');
import { join } from 'path';
import {
  AbstractPackageManager,
  PackageManagerFactory,
} from '../lib/package-managers';
import { BANNER, MESSAGES } from '../lib/ui';
import { AbstractAction } from './abstract.action';

interface LockfileDependency {
  version: string;
}

interface PackageJsonDependencies {
  [key: string]: LockfileDependency;
}

interface NestDependency {
  name: string;
  value: string;
}

export class InfoAction extends AbstractAction {
  private manager!: AbstractPackageManager;

  public async handle() {
    this.manager = await PackageManagerFactory.find();
    this.displayBanner();
    await this.displaySystemInformation();
    await this.displayNestInformation();
  }

  private displayBanner() {
    console.info(chalk.red(BANNER));
  }

  private async displaySystemInformation(): Promise<void> {
    console.info(chalk.green('[System Information]'));
    console.info('OS Version     :', chalk.blue(osName(platform(), release())));
    console.info('NodeJS Version :', chalk.blue(process.version));
    await this.displayPackageManagerVersion();
  }

  async displayPackageManagerVersion() {
    try {
      const version: string = await this.manager.version();
      console.info(
        `${this.manager.name} Version    :`,
        chalk.blue(version),
        '\n',
      );
    } catch {
      console.error(
        `${this.manager.name} Version    :`,
        chalk.red('Unknown'),
        '\n',
      );
    }
  }

  async displayNestInformation(): Promise<void> {
    this.displayCliVersion();
    console.info(chalk.green('[Nest Platform Information]'));
    await this.displayNestInformationFromPackage();
  }

  async displayNestInformationFromPackage(): Promise<void> {
    try {
      const dependencies: PackageJsonDependencies =
        this.readProjectPackageDependencies();
      this.displayNestVersions(dependencies);
    } catch (err) {
      console.error(
        chalk.red(MESSAGES.NEST_INFORMATION_PACKAGE_MANAGER_FAILED),
      );
    }
  }

  displayCliVersion(): void {
    console.info(chalk.green('[Nest CLI]'));
    console.info(
      'Nest CLI Version :',
      chalk.blue(
        JSON.parse(readFileSync(join(__dirname, '../package.json')).toString())
          .version,
      ),
      '\n',
    );
  }

  readProjectPackageDependencies(): PackageJsonDependencies {
    const buffer = readFileSync(join(process.cwd(), 'package.json'));
    const pack = JSON.parse(buffer.toString());
    const dependencies = { ...pack.dependencies, ...pack.devDependencies };
    Object.keys(dependencies).forEach((key) => {
      dependencies[key] = {
        version: dependencies[key],
      };
    });
    return dependencies;
  }

  displayNestVersions(dependencies: PackageJsonDependencies) {
    this.buildNestVersionsMessage(dependencies).forEach((dependency) =>
      console.info(dependency.name, chalk.blue(dependency.value)),
    );
  }

  buildNestVersionsMessage(
    dependencies: PackageJsonDependencies,
  ): NestDependency[] {
    const nestDependencies = this.collectNestDependencies(dependencies);
    return this.format(nestDependencies);
  }

  collectNestDependencies(
    dependencies: PackageJsonDependencies,
  ): NestDependency[] {
    const nestDependencies: NestDependency[] = [];
    Object.keys(dependencies).forEach((key) => {
      if (key.indexOf('@nestjs') > -1) {
        const depPackagePath = require.resolve(key + '/package.json', {
          paths: [process.cwd()],
        });
        const depPackage = readFileSync(depPackagePath).toString();
        const value = JSON.parse(depPackage).version;
        nestDependencies.push({
          name: `${key.replace(/@nestjs\//, '').replace(/@.*/, '')} version`,
          value: value || dependencies[key].version,
        });
      }
    });
    return nestDependencies;
  }

  format(dependencies: NestDependency[]): NestDependency[] {
    const sorted = dependencies.sort(
      (dependencyA, dependencyB) =>
        dependencyB.name.length - dependencyA.name.length,
    );
    const length = sorted[0].name.length;
    sorted.forEach((dependency) => {
      if (dependency.name.length < length) {
        dependency.name = this.rightPad(dependency.name, length);
      }
      dependency.name = dependency.name.concat(' :');
      dependency.value = dependency.value.replace(/(\^|\~)/, '');
    });
    return sorted;
  }

  rightPad(name: string, length: number): string {
    while (name.length < length) {
      name = name.concat(' ');
    }
    return name;
  }
}
