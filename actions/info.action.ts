import { AbstractAction } from './abstract.action';
import { platform, release } from 'os';
import chalk from 'chalk';
import { BANNER, messages } from '../lib/ui';
import osName = require('os-name');
import { PackageManagerFactory, AbstractPackageManager } from '../lib/package-managers';
import { readFile } from 'fs';
import { join } from 'path';
import { ActionLogger } from './action.logger';

interface Inputs {}

interface Options {}

interface PacakgeJsonDependencies {
  [key: string]: string;
}

interface NestDependency {
  name: string;
  value: string;
}

export class InfoAction extends AbstractAction {
  public async handle(args: Inputs, options: Options, logger: ActionLogger) {
    displayBanner(logger);
    await displaySystemInformation(logger);
    await displayNestInformation(logger);
  }
}

const displayBanner = (logger: ActionLogger) => {
  logger.info(chalk.red(BANNER));
}

const displaySystemInformation = async (logger: ActionLogger) => {
  logger.info(chalk.green('[System Information]'));
  logger.info('OS Version     :', chalk.blue(osName(platform(), release())));
  logger.info('NodeJS Version :', chalk.blue(process.version));
  await displayPackageManagerVersion(logger);
}

const displayPackageManagerVersion = async (logger: ActionLogger) => {
  const manager: AbstractPackageManager = await PackageManagerFactory.find(logger)
  try {
    const version: string = await manager.version();
    logger.info(`${ manager.name } Version    :`, chalk.blue(version));
  } catch {
    logger.error(`${ manager.name } Version    :`, chalk.red('Unknown'));
  }
}

const displayNestInformation = async (logger: ActionLogger) => {
  logger.info(chalk.green('[Nest Information]'));
  try {
    const dependencies: PacakgeJsonDependencies = await readProjectPackageJsonDependencies();
    displayNestVersions(logger, dependencies);
  } catch {
    logger.error(chalk.red(messages.NEST_INFORMATION_PACKAGE_MANAGER_FAILED));
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

const displayNestVersions = (logger: ActionLogger, dependencies: PacakgeJsonDependencies) => {
  buildNestVersionsMessage(dependencies)
    .forEach((dependency) => logger.info(dependency.name, chalk.blue(dependency.value)));
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