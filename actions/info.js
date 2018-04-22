const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const osName = require('os-name');
const { banner } = require('../lib/banner');
const { PackageManagerFactory } = require('../lib/package-managers');

module.exports = (args, options, logger) => {
  displayBanner(logger);
  return displaySystemInformation(logger).then(() => displayNestInformation(logger));
};

function displayBanner(logger) {
  logger.info(chalk.red(banner));
}

function displaySystemInformation(logger) {
  logger.info(chalk.green('[System Information]'));
  logger.info('OS Version     :', chalk.blue(osName(os.platform(), os.release())));
  logger.info('NodeJS Version :', chalk.blue(process.version));
  return getNpmVersion(logger);
}

function getNpmVersion(logger) {
  return PackageManagerFactory
    .find(logger)
    .then((packageManager) =>
      packageManager.version()
        .then((version) => logger.info(`${ packageManager.name } Version    :`, chalk.blue(version)))
        .catch(() => logger.error(`${ packageManager.name() } Version    :`, chalk.red('Unknown')))
    );
}

function displayNestInformation(logger) {
  logger.info(chalk.green('[Nest Information]'));
  return readProjectPackageJsonDependencies()
    .then((dependencies) => displayNestVersions(logger, dependencies))
    .catch(() => logger.error(chalk.red('Can not read your project package.json file, are you on your project folder ?')));
}

function readProjectPackageJsonDependencies() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(process.cwd(), 'package.json'), (error, buffer) => {
      if (error !== undefined && error !== null) {
        reject(error);
      } else {
        resolve(JSON.parse(buffer).dependencies);
      }
    });
  });
}

function displayNestVersions(logger, dependencies) {
  buildNestVersionsMessage(dependencies)
    .forEach((dependency) => logger.info(dependency.name, chalk.blue(dependency.value)));
}

function buildNestVersionsMessage(dependencies) {
  const nestDependencies = collectNestDependencies(dependencies);
  return format(nestDependencies);
}

function collectNestDependencies(dependencies) {
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

function format(dependencies) {
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

function rightPad(name, length) {
  while (name.length < length) {
    name = name.concat(' ');
  }
  return name;
}