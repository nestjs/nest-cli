import { AbstractAction } from './abstract.action';
import { messages } from '../lib/ui';
import * as inquirer from 'inquirer';
import { CollectionFactory, Collection, SchematicOption, AbstractCollection } from '../lib/schematics';
import { PackageManager, PackageManagerFactory, AbstractPackageManager } from '../lib/package-managers';
import chalk from 'chalk';
import { PromptModule, Answers } from 'inquirer';
import { ActionLogger } from './action.logger';

interface Inputs {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
}

interface Options {
  dryRun?: boolean
}

export class NewAction extends AbstractAction {
  public async handle(args: Inputs, options: Options, logger: ActionLogger) {
    const inputs: Inputs = await askForMissingInformation(args, logger);
    await generateApplication(inputs, options, logger);
    await installPackages(inputs, options, logger);
  }
}

const askForMissingInformation = async (inputs: Inputs, logger: ActionLogger): Promise<Inputs> => {
  logger.info();
  logger.info(messages.PROJECT_INFORMATION_START);
  logger.info(messages.ADDITIONAL_INFORMATION);
  logger.info();
  const prompt: PromptModule = inquirer.createPromptModule();
  const questions = [];
  if (inputs.name === undefined) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'name :',
      default: 'nestjs-app-name'
    });
  }
  if (inputs.description === undefined) {
    questions.push({
      type: 'input',
      name: 'description',
      message: 'description :',
      default: 'description'
    });
  }
  if (inputs.version === undefined) {
    questions.push({
      type: 'input',
      name: 'version',
      message: 'version :',
      default: '1.0.0'
    });
  }
  if (inputs.author === undefined) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'author :',
      default: ''
    });
  }
  const answers: Answers = await prompt(questions);
  inputs.name = inputs.name !== undefined ? inputs.name : answers.name;
  inputs.description = inputs.description !== undefined ? inputs.description : answers.description;
  inputs.version = inputs.version !== undefined ? inputs.version : answers.version;
  inputs.author = inputs.author !== undefined ? inputs.author : answers.author;
  logger.info();
  logger.info(messages.PROJECT_INFORMATION_COLLECTED);
  logger.info();
  return inputs;
}

const generateApplication = async (args: Inputs, options: Options, logger: ActionLogger) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS, logger);
  const schematicOptions: SchematicOption[] = parse(args, options);
  await collection.execute('application', schematicOptions);
}

const parse = (args: Inputs, options: Options): SchematicOption[] => {
  const schematicOptions: SchematicOption[] = [];
  Object.keys(args).forEach((key) => {
    schematicOptions.push(new SchematicOption(key, args[ key ]));
  });
  Object.keys(options).forEach((key) => {
    schematicOptions.push(new SchematicOption(key, options[ key ] !== undefined));
  });
  return schematicOptions;
}

const installPackages = async (inputs: Inputs, options: Options, logger: ActionLogger) => {
  if (!options.dryRun) {
    const packageManager: AbstractPackageManager = await selectPackageManager(logger);
    await packageManager.install(inputs.name);
  } else {
    logger.info();
    logger.info(chalk.green(messages.DRY_RUN_MODE));
    logger.info();
  }
}

const selectPackageManager = async (logger: ActionLogger): Promise<AbstractPackageManager> => {
  const prompt = inquirer.createPromptModule();
  const questions = [{
    type: 'list',
    name: 'package-manager',
    message: messages.PACKAGE_MANAGER_QUESTION,
    choices: [ PackageManager.NPM, PackageManager.YARN ]
  }];
  const answers: Answers = await prompt(questions);
  return PackageManagerFactory.create(answers[ 'package-manager' ], logger);
}
