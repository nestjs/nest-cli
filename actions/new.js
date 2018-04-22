const inquirer = require('inquirer');
const chalk = require('chalk');
const { strings } = require('@angular-devkit/core');
const { Collection, CollectionFactory, SchematicOption } = require('../lib/schematics')
const { PackageManager } = require('../utils/package-managers');

module.exports = (args, options, logger) => {
  logger.debug(chalk.blue('[DEBUG] - new command -'), args, options);
  return askForMissingInformation(args, logger)
    .then(() => executeSchematic(args, options, logger))
    .then(() => {
      if (!options[ 'dryRun' ]) {
        return selectPackageManager();
      }
    })
    .then((packageManager) => installPackages(packageManager, strings.dasherize(args.name), logger));
};

function askForMissingInformation(args, logger) {
  logger.info(chalk.green('Ask for missing information to create the project'));
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
    logger.info(chalk.green('Missing information collected'));
  });
}

function executeSchematic(args, options, logger) {
  const collection = CollectionFactory.create(Collection.NESTJS, logger);
  const schematicOptions = Parser.parse(args, options);
  return collection.execute('application', schematicOptions);
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
