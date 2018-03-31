const inquirer = require('inquirer');
const chalk = require('chalk');
const { strings } = require('@angular-devkit/core');
const { COLLECTIONS, Schematic, SchematicOption } = require('../utils/schematics');
const { PackageManager } = require('../utils/package-managers');

module.exports = (args, options, logger) => {
  return executeSchematic(args, options, logger)
    .then(() => {
      if (!options[ 'dry-run' ]) {
        return selectPackageManager();
      }
    })
    .then((packageManager) => installPackages(packageManager, strings.dasherize(args.name), logger));
};

function executeSchematic(args, options, logger) {
  const schematic = Schematic.create(COLLECTIONS.NESTJS, logger);
  const schematicOptions = Parser.parse(args, options);
  return schematic.execute('application', schematicOptions);
}

class Parser {
  static parse(args, options) {
    const schematicOptions = [];
    Object.keys(args).forEach((key) => {
      schematicOptions.push(new SchematicOption(key, args[ key ]));
    });
    Object.keys(options).forEach((key) => {
      schematicOptions.push(new SchematicOption(key, options[ key ] !== undefined));
    });
    return schematicOptions;
  }
}

function selectPackageManager() {
  const question = {
    type: 'list',
    name: 'package-manager',
    message: 'Which package manager to use ?',
    choices: [ 'npm', 'yarn' ]
  };
  return inquirer.prompt(question).then((answer) => answer[ question.name ]);
}

function installPackages(packageManager, directory, logger) {
  if (packageManager !== undefined && packageManager !== null && packageManager !== '') {
    return PackageManager.create(packageManager, logger).install(directory);
  } else {
    logger.info(chalk.green('Command run in dry mode, nothing to change !'));
  }
}
