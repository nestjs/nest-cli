import { AbstractAction } from './abstract.action';
import { messages } from '../lib/ui';
import * as inquirer from 'inquirer';
import { CollectionFactory, Collection, SchematicOption, AbstractCollection } from '../lib/schematics';
import { PackageManager, PackageManagerFactory, AbstractPackageManager } from '../lib/package-managers';
import chalk from 'chalk';
import { PromptModule, Answers, Question } from 'inquirer';
import { Command } from 'commander';
import { Input } from '../commands';
import { generateInput, generateSelect } from '../lib/questions/questions';

export class NewAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    const questions: Question[] = generateQuestionsForMissingInputs(inputs);
    const answers: Answers = await askForMissingInformation(questions);
    const args: Input[] = replaceInputMissingInformation(inputs, answers);
    await generateApplicationFiles(inputs, options);
    if (!options.find((option) => option.name === 'skip-install')) {
      await installPackages(inputs, options);
    }
  }
}

const generateQuestionsForMissingInputs = (inputs: Input[]): Question[] => {
  return inputs
    .map((input) => generateInput(input.name)(input.value)(generateDefaultAnswer(input.name)))
    .filter((question) => question !== undefined);
};

const generateDefaultAnswer = (name: string): string => {
  if (name === 'name') {
    return 'nestjs-app-name';
  } else if (name === 'description') {
    return 'description';
  } else if (name === 'version') {
    return '1.0.0';
  } else if (name === 'author') {
    return '';
  }
};

const askForMissingInformation = async (questions: Question[]): Promise<Answers> => {
  console.info();
  console.info(messages.PROJECT_INFORMATION_START);
  console.info(messages.ADDITIONAL_INFORMATION);
  console.info();
  const prompt: PromptModule = inquirer.createPromptModule();
  const answers: Answers = await prompt(questions);
  console.info();
  console.info(messages.PROJECT_INFORMATION_COLLECTED);
  console.info();
  return answers;
};

const replaceInputMissingInformation = (inputs: Input[], answers: Answers): Input[] => {
  return inputs.map((input) => input.value = input.value !== undefined ? input.value : answers[ input.name ]);
};

const generateApplicationFiles = async (args: Input[], options: Input[]) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
  const schematicOptions: SchematicOption[] = mapSchematicOptions(args.concat(options));
  await collection.execute('application', schematicOptions);
};

const mapSchematicOptions = (options: Input[]): SchematicOption[] => {
  return options.reduce((schematicOptions: SchematicOption[], option: Input) => {
    if (option.name !== 'skip-install') {
      schematicOptions.push(new SchematicOption(option.name, option.value));
    }
    return schematicOptions;
  }, []);
}

const installPackages = async (inputs: Input[], options: Input[]) => {
  const installDirectory: string = inputs.find((input) => input.name === 'name').value as string;
  const dryRunMode: boolean = options.find((option) => option.name === 'dry-run').value as boolean;
  if (!dryRunMode) {
    const packageManager: AbstractPackageManager = await selectPackageManager();
    await packageManager.install(installDirectory);
  } else {
    console.info();
    console.info(chalk.green(messages.DRY_RUN_MODE));
    console.info();
  }
};

const selectPackageManager = async (): Promise<AbstractPackageManager> => {
  const answers: Answers = await askForPackageManager();
  return PackageManagerFactory.create(answers[ 'package-manager' ]);
};

const askForPackageManager = async (): Promise<Answers> => {
  const questions: Question[] = [
    generateSelect('package-manager')(messages.PACKAGE_MANAGER_QUESTION)([ PackageManager.NPM, PackageManager.YARN ])
  ];
  const prompt = inquirer.createPromptModule();
  return await prompt(questions);
};
