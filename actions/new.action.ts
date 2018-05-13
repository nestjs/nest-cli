import { AbstractAction } from './abstract.action';
import { messages } from '../lib/ui';
import * as inquirer from 'inquirer';
import { CollectionFactory, Collection, SchematicOption, AbstractCollection } from '../lib/schematics';
import { PackageManager, PackageManagerFactory, AbstractPackageManager } from '../lib/package-managers';
import chalk from 'chalk';
import { PromptModule, Answers } from 'inquirer';
import { Command } from 'commander';
import { Input } from '../commands';

export class NewAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    console.log('inputs');
    console.log(inputs);
    console.log('options');
    console.log(options);
    // const inputs: string[] = args.concat(await askForMissingInformation(args));
    // const inputs: Inputs = await askForMissingInformation(args);
    // await generateApplication(inputs, options);
    // await installPackages(inputs, options);
  }
}

// const askForMissingInformation = async (args: string[]): Promise<string[]> => {
//   console.info();
//   console.info(messages.PROJECT_INFORMATION_START);
//   console.info(messages.ADDITIONAL_INFORMATION);
//   console.info();
//   const prompt: PromptModule = inquirer.createPromptModule();
//   const questions = [];
//   if (inputs.name === undefined) {
//     questions.push({
//       type: 'input',
//       name: 'name',
//       message: 'name :',
//       default: 'nestjs-app-name'
//     });
//   }
//   if (inputs.description === undefined) {
//     questions.push({
//       type: 'input',
//       name: 'description',
//       message: 'description :',
//       default: 'description'
//     });
//   }
//   if (inputs.version === undefined) {
//     questions.push({
//       type: 'input',
//       name: 'version',
//       message: 'version :',
//       default: '1.0.0'
//     });
//   }
//   if (inputs.author === undefined) {
//     questions.push({
//       type: 'input',
//       name: 'author',
//       message: 'author :',
//       default: ''
//     });
//   }
//   const answers: Answers = await prompt(questions);
//   inputs.name = inputs.name !== undefined ? inputs.name : answers.name;
//   inputs.description = inputs.description !== undefined ? inputs.description : answers.description;
//   inputs.version = inputs.version !== undefined ? inputs.version : answers.version;
//   inputs.author = inputs.author !== undefined ? inputs.author : answers.author;
//   console.info();
//   console.info(messages.PROJECT_INFORMATION_COLLECTED);
//   console.info();
//   return inputs;
// }

// const generateApplication = async (args: Inputs, options: Options) => {
//   const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
//   const schematicOptions: SchematicOption[] = parse(args, options);
//   await collection.execute('application', schematicOptions);
// }

// const parse = (args: Inputs, options: Options): SchematicOption[] => {
//   const schematicOptions: SchematicOption[] = [];
//   Object.keys(args).forEach((key) => {
//     schematicOptions.push(new SchematicOption(key, args[ key ]));
//   });
//   Object.keys(options).forEach((key) => {
//     schematicOptions.push(new SchematicOption(key, options[ key ] !== undefined));
//   });
//   return schematicOptions;
// }

// const installPackages = async (inputs: Inputs, options: Options) => {
//   if (!options.dryRun) {
//     const packageManager: AbstractPackageManager = await selectPackageManager();
//     await packageManager.install(inputs.name);
//   } else {
//     console.info();
//     console.info(chalk.green(messages.DRY_RUN_MODE));
//     console.info();
//   }
// }

// const selectPackageManager = async (): Promise<AbstractPackageManager> => {
//   const prompt = inquirer.createPromptModule();
//   const questions = [{
//     type: 'list',
//     name: 'package-manager',
//     message: messages.PACKAGE_MANAGER_QUESTION,
//     choices: [ PackageManager.NPM, PackageManager.YARN ]
//   }];
//   const answers: Answers = await prompt(questions);
//   return PackageManagerFactory.create(answers[ 'package-manager' ]);
// }
