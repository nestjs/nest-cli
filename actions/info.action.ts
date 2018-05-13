import { AbstractAction } from './abstract.action';
import { platform, release } from 'os';
import chalk from 'chalk';
import { BANNER, messages } from '../lib/ui';
import osName = require('os-name');
import { PackageManagerFactory, AbstractPackageManager } from '../lib/package-managers';
import { readFile } from 'fs';
import { join } from 'path';

interface PacakgeJsonDependencies {
  [key: string]: string;
}

interface NestDependency {
  name: string;
  value: string;
}

export class InfoAction extends AbstractAction {
  public async handle() {
    displayBanner();
    await displaySystemInformation();
    await displayNestInformation();
  }
}

const displayBanner = () => {
  console.info(chalk.red(BANNER));
}

const displaySystemInformation = async () => {
  console.info(chalk.green('[System Information]'));
  console.info('OS Version     :', chalk.blue(osName(platform(), release())));
  console.info('NodeJS Version :', chalk.blue(process.version));
  await displayPackageManagerVersion();
}

const displayPackageManagerVersion = async () => {
  const manager: AbstractPackageManager = await PackageManagerFactory.find();
  try {
    const version: string = await manager.version();
    console.info(`${ manager.name } Version    :`, chalk.blue(version));
  } catch {
    console.error(`${ manager.name } Version    :`, chalk.red('Unknown'));
  }
}

const displayNestInformation = async () => {
  console.info(chalk.green('[Nest Information]'));
  try {
    const dependencies: PacakgeJsonDependencies = await readProjectPackageJsonDependencies();
    displayNestVersions(dependencies);
  } catch {
    console.error(chalk.red(messages.NEST_INFORMATION_PACKAGE_MANAGER_FAILED));
  }
}

const readProjectPackageJsonDependencies = async (): Promise<PacakgeJsonDependencies> => {
  return new Promise<PacakgeJsonDependencies>((resolve, reject) => {
    readFile(join(process.cwd(), 'package.json'), (error: NodeJS.ErrnoException, buffer: Buffer) => {
      if (error !== undefined && error !== null) {
        reject(error);
      } else {
        resolve(JSON.parse(buffer.toString()).dependencies);
      }
    });
  });
}

const displayNestVersions = (dependencies: PacakgeJsonDependencies) => {
  buildNestVersionsMessage(dependencies)
    .forEach((dependency) => console.info(dependency.name, chalk.blue(dependency.value)));
}

const buildNestVersionsMessage = (dependencies: PacakgeJsonDependencies): NestDependency[] => {
  const nestDependencies = collectNestDependencies(dependencies);
  return format(nestDependencies);
}

const collectNestDependencies = (dependencies: PacakgeJsonDependencies): NestDependency[] => {
  const nestDependencies: NestDependency[] = [];
  Object.keys(dependencies).forEach((key) => {
    if (key.indexOf('@nestjs') > -1) {
      nestDependencies.push({
        name: `${ key.replace(/@nestjs\//, '') } version`,
        value: dependencies[ key ]
      });
    }
  });
  return nestDependencies;
}

const format = (dependencies: NestDependency[]): NestDependency[] => {
  const sorted = dependencies.sort((dependencyA, dependencyB) => dependencyB.name.length - dependencyA.name.length);
  const length = sorted[ 0 ].name.length;
  sorted.forEach((dependency) => {
    if (dependency.name.length < length) {
      dependency.name = rightPad(dependency.name, length);
    }
    dependency.name = dependency.name.concat(' :');
    dependency.value = dependency.value.replace(/(\^|\~)/, '');
  });
  return sorted;
}

const rightPad = (name: string, length: number): string => {
  while (name.length < length) {
    name = name.concat(' ');
  }
  return name;
}