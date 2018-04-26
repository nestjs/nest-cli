import { AbstractAction } from './abstract.action';
import { platform, release } from 'os';
import chalk from 'chalk';
import { BANNER, messages } from '../lib/ui';
import osName = require('os-name');
import { PackageManagerFactory, AbstractPackageManager } from '../lib/package-managers';
import { readFile } from 'fs';
import { join } from 'path';

export class InfoAction extends AbstractAction {
  public async handle(args: any, options: any, logger: any) {
    displayBanner(logger);
    await displaySystemInformation(logger);
    await displayNestInformation(logger);
  }
}

const displayBanner = (logger: any) => {
  logger.info(chalk.red(BANNER));
}

const displaySystemInformation = async (logger: any) => {
  logger.info(chalk.green('[System Information]'));
  logger.info('OS Version     :', chalk.blue(osName(platform(), release())));
  logger.info('NodeJS Version :', chalk.blue(process.version));
  await displayPackageManagerVersion(logger);
}

const displayPackageManagerVersion = async (logger) => {
  const manager: AbstractPackageManager = await PackageManagerFactory.find(logger)
  try {
    const version: string = await manager.version();
    logger.info(`${ manager.name } Version    :`, chalk.blue(version));
  } catch {
    logger.error(`${ manager.name } Version    :`, chalk.red('Unknown'));
  }
}

const displayNestInformation = async (logger: any) => {
  logger.info(chalk.green('[Nest Information]'));
  try {
    const dependencies: {[key: string]: string} = await readProjectPackageJsonDependencies();
    displayNestVersions(logger, dependencies);
  } catch {
    logger.error(chalk.red(messages.NEST_INFORMATION_PACKAGE_MANAGER_FAILED));
  }
}

const readProjectPackageJsonDependencies = async (): Promise<{[key: string]: string}> => {
  return new Promise<{[key: string]: string}>((resolve, reject) => {
    readFile(join(process.cwd(), 'package.json'), (error: NodeJS.ErrnoException, buffer: Buffer) => {
      if (error !== undefined && error !== null) {
        reject(error);
      } else {
        resolve(JSON.parse(buffer.toString()).dependencies);
      }
    });
  });
}

const displayNestVersions = (logger, dependencies) => {
  buildNestVersionsMessage(dependencies)
    .forEach((dependency) => logger.info(dependency.name, chalk.blue(dependency.value)));
}

const buildNestVersionsMessage = (dependencies) => {
  const nestDependencies = collectNestDependencies(dependencies);
  return format(nestDependencies);
}

const collectNestDependencies = (dependencies) => {
  const nestDependencies = [];
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

const format = (dependencies) => {
  const sorted = dependencies.sort((dependencyA, dependencyB) => dependencyA.name.length - dependencyB.name.length < 0);
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

const rightPad = (name, length) => {
  while (name.length < length) {
    name = name.concat(' ');
  }
  return name;
}