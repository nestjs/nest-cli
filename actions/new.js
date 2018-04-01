const inquirer = require('inquirer');
const chalk = require('chalk');
const { strings } = require('@angular-devkit/core');
const { COLLECTIONS, Schematic, SchematicOption } = require('../utils/schematics');
const { PackageManager } = require('../utils/package-managers');

module.exports = (args, options, logger) => {
  return askForMissingInformation(args)
    .then(() => executeSchematic(args, options, logger))
    .then(() => {
      if (!options[ 'dry-run' ]) {
        return selectPackageManager();
      }
    })
    .then((packageManager) => installPackages(packageManager, strings.dasherize(args.name), logger));
};

function askForMissingInformation(args) {
  const prompt = inquirer.createPromptModule();
  const questions = [];
  if (args.name === undefined) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'name :',
      default: 'nestjs-app-name'
    });
  }
  if (args.description === undefined) {
    questions.push({
      type: 'input',
      name: 'description',
      message: 'description :',
      default: 'description'
    });
  }
  if (args.version === undefined) {
    questions.push({
      type: 'input',
      name: 'version',
      message: 'version :',
      default: '1.0.0'
    });
  }
  if (args.author === undefined) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'author :',
      default: ''
    });
  }
  return prompt(questions).then((answers) => {
    args.name = args.name !== undefined ? args.name : answers.name;
    args.description = args.description !== undefined ? args.description : answers.description;
    args.version = args.version !== undefined ? args.version : answers.version;
    args.author = args.author !== undefined ? args.author : answers.author;
  });
}

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
  const prompt = inquirer.createPromptModule();
  const questions = [{
    type: 'list',
    name: 'package-manager',
    message: 'Which package manager to use ?',
    choices: [ 'npm', 'yarn' ]
  }];
  return prompt(questions).then((answers) => answers[ 'package-manager' ]);
}

function installPackages(packageManager, directory, logger) {
  if (packageManager !== undefined && packageManager !== null && packageManager !== '') {
    return PackageManager.create(packageManager, logger).install(directory);
  } else {
    logger.info(chalk.green('Command run in dry mode, nothing to change !'));
  }
}
