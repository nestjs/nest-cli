import * as chalk from 'chalk';
import { readFile } from 'fs';
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
  resolved: string;
  integrity: string;
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
};

const displayCliVersion = () => {
  console.info(chalk.green('[Nest CLI]'));
  console.info(
    'Nest CLI Version :',
    chalk.blue(require('../package.json').version),
    '\n',
  );
};

const readProjectPackageJsonDependencies = async (): Promise<
  PackageJsonDependencies
> => {
  return new Promise<PackageJsonDependencies>((resolve, reject) => {
    readFile(
      join(process.cwd(), 'package.json'),
      (error: NodeJS.ErrnoException | null, buffer: Buffer) => {
        if (error !== undefined && error !== null) {
          reject(error);
        } else {
          resolve(JSON.parse(buffer.toString()).dependencies);
        }
      },
    );
  });
};

const displayNestVersions = (dependencies: PackageJsonDependencies) => {
  buildNestVersionsMessage(dependencies).forEach((dependency) =>
    console.info(dependency.name, chalk.blue(dependency.value)),
  );
};

const buildNestVersionsMessage = (
  dependencies: PackageJsonDependencies,
): NestDependency[] => {
  const nestDependencies = collectNestDependencies(dependencies);
  return format(nestDependencies);
};

const collectNestDependencies = (
  dependencies: PackageJsonDependencies,
): NestDependency[] => {
  const nestDependencies: NestDependency[] = [];
  Object.keys(dependencies).forEach((key) => {
    if (key.indexOf('@nestjs') > -1) {
      nestDependencies.push({
        name: `${key.replace(/@nestjs\//, '')} version`,
        value: dependencies[key],
      });
    }
  });
  return nestDependencies;
};

const format = (dependencies: NestDependency[]): NestDependency[] => {
  const sorted = dependencies.sort(
    (dependencyA, dependencyB) =>
      dependencyB.name.length - dependencyA.name.length,
  );
  const length = sorted[0].name.length;
  sorted.forEach((dependency) => {
    if (dependency.name.length < length) {
      dependency.name = rightPad(dependency.name, length);
    }
    return name;
  }
}
