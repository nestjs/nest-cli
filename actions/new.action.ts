import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Answers, PromptModule, Question } from 'inquirer';
import { Input } from '../commands';
import { AbstractPackageManager, PackageManager, PackageManagerFactory } from '../lib/package-managers';
import { generateInput, generateSelect } from '../lib/questions/questions';
import { AbstractCollection, Collection, CollectionFactory, SchematicOption } from '../lib/schematics';
import { messages } from '../lib/ui';
import { AbstractAction } from './abstract.action';

export class NewAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    const questions: Question[] = generateQuestionsForMissingInputs(inputs);
    const answers: Answers = await askForMissingInformation(questions);
    const args: Input[] = replaceInputMissingInformation(inputs, answers);
    await generateApplicationFiles(inputs, options);
    if (!options.find(option => option.name === 'skip-install')!.value) {
      await installPackages(inputs, options);
    }
  }
}

const generateQuestionsForMissingInputs = (inputs: Input[]): Question[] => {
  return inputs
    .map(input => generateInput(input.name)(input.value)(generateDefaultAnswer(input.name)))
    .filter(question => question !== undefined) as Array<Question<Answers>>;
};

const generateDefaultAnswer = (name: string) => {
  switch (name) {
    case 'name':
      return 'nestjs-app-name';
    case 'description':
      return 'description';
    case 'version':
      return '0.0.0';
    case 'author':
    default:
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
  return inputs.map(input => (input.value = input.value !== undefined ? input.value : answers[input.name]));
};

const generateApplicationFiles = async (args: Input[], options: Input[]) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
  const schematicOptions: SchematicOption[] = mapSchematicOptions(args.concat(options));
  await collection.execute('application', schematicOptions);
  console.info();
};

const mapSchematicOptions = (options: Input[]): SchematicOption[] => {
  return options.reduce((schematicOptions: SchematicOption[], option: Input) => {
    if (option.name !== 'skip-install' && option.value !== 'package-manager') {
      schematicOptions.push(new SchematicOption(option.name, option.value));
    }
    return schematicOptions;
  }, []);
};

const installPackages = async (inputs: Input[], options: Input[]) => {
  const installDirectory = inputs.find(input => input.name === 'name')!.value as string;
  const dryRunMode = options.find(option => option.name === 'dry-run')!.value as boolean;
  const inputPackageManager = options.find(option => option.name === 'package-manager')!.value as string;
  if (dryRunMode) {
    console.info();
    console.info(chalk.green(messages.DRY_RUN_MODE));
    console.info();
    return;
  } else if (inputPackageManager !== undefined) {
    try {
      const packageManager = PackageManagerFactory.create(inputPackageManager);
      await packageManager.install(installDirectory);
    } catch (error) {
      console.error(chalk.red(error.message));
    }
  } else {
    const packageManager: AbstractPackageManager = await selectPackageManager();
    await packageManager.install(installDirectory);
  }

  const packageManager: AbstractPackageManager = await selectPackageManager();
  await packageManager.install(installDirectory);
};

const selectPackageManager = async (): Promise<AbstractPackageManager> => {
  const answers: Answers = await askForPackageManager();
  return PackageManagerFactory.create(answers['package-manager']);
};

const askForPackageManager = async (): Promise<Answers> => {
  const questions: Question[] = [
    generateSelect('package-manager')(messages.PACKAGE_MANAGER_QUESTION)([PackageManager.NPM, PackageManager.YARN]),
  ];
  const prompt = inquirer.createPromptModule();
  return await prompt(questions);
};
