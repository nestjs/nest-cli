import { dasherize } from '@angular-devkit/core/src/utils/strings';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as inquirer from 'inquirer';
import { Answers, PromptModule, Question } from 'inquirer';
import { join } from 'path';
import { Input } from '../commands';
import { AbstractPackageManager, PackageManager, PackageManagerFactory } from '../lib/package-managers';
import { generateInput, generateSelect } from '../lib/questions/questions';
import { GitRunner } from '../lib/runners/git.runner';
import { AbstractCollection, Collection, CollectionFactory, SchematicOption } from '../lib/schematics';
import { emojis, messages } from '../lib/ui';
import { AbstractAction } from './abstract.action';

export class NewAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    const questions: Question[] = generateQuestionsForMissingInputs(inputs);
    const answers: Answers = await askForMissingInformation(questions);
    const args: Input[] = replaceInputMissingInformation(inputs, answers);

    const dryRunOption = options.find(option => option.name === 'dry-run');
    const isDryRunEnabled = dryRunOption && dryRunOption.value;

    const collectionOption = options.find(option => option.name === 'collection' && option.value != null);

    // @ts-ignore
    const collectionName: any = collectionOption.value;

    await generateApplicationFiles(
      inputs,
      options,
      isDryRunEnabled as boolean,
      collectionName,
    ).catch(exit);

    const shouldSkipInstall = options.some(
      option => option.name === 'skip-install' && option.value === true,
    );
    const projectDirectory = dasherize(inputs.find(
      input => input.name === 'name',
    )!.value as string);

    if (!shouldSkipInstall) {
      await installPackages(
        options,
        isDryRunEnabled as boolean,
        projectDirectory,
      );
    }
    if (!isDryRunEnabled) {
      await initializeGitRepository(projectDirectory);
      printCollective();
    }
  }
}

const generateQuestionsForMissingInputs = (inputs: Input[]): Question[] => {
  return inputs
    .map(input =>
      generateInput(input.name)(input.value)(generateDefaultAnswer(input.name)),
    )
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

const askForMissingInformation = async (
  questions: Question[],
): Promise<Answers> => {
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

const replaceInputMissingInformation = (
  inputs: Input[],
  answers: Answers,
): Input[] => {
  return inputs.map(
    input =>
      (input.value =
        input.value !== undefined ? input.value : answers[input.name]),
  );
};

const generateApplicationFiles = async (
  args: Input[],
  options: Input[],
  isDryRunEnabled: boolean,
  collectionName: any,
) => {
  const collection: AbstractCollection = CollectionFactory.create(
    collectionName || Collection.NESTJS,
  );
  const schematicOptions: SchematicOption[] = mapSchematicOptions(
    args.concat(options),
  );
  await collection.execute('application', schematicOptions);

  if (!isDryRunEnabled) {
    await generateConfigurationFile(args, options, collection, collectionName);
  }
  console.info();
};

const mapSchematicOptions = (options: Input[]): SchematicOption[] => {
  return options.reduce(
    (schematicOptions: SchematicOption[], option: Input) => {
      if (
        option.name !== 'skip-install' &&
        option.value !== 'package-manager'
      ) {
        schematicOptions.push(new SchematicOption(option.name, option.value));
      }
      return schematicOptions;
    },
    [],
  );
};

const generateConfigurationFile = async (
  args: Input[],
  options: Input[],
  collection: AbstractCollection,
  collectionName: any,
) => {
  const schematicOptions: SchematicOption[] = mapConfigurationSchematicOptions(
    args.concat(options),
  );
  schematicOptions.push(
    new SchematicOption('collection', collectionName),
  );
  await collection.execute('configuration', schematicOptions);
};

const mapConfigurationSchematicOptions = (
  inputs: Input[],
): SchematicOption[] => {
  return inputs.reduce(
    (schematicsOptions: SchematicOption[], option: Input) => {
      if (option.name === 'name') {
        schematicsOptions.push(
          new SchematicOption('project', dasherize(option.value as string)),
        );
      }
      if (option.name === 'language') {
        schematicsOptions.push(new SchematicOption(option.name, option.value));
      }
      return schematicsOptions;
    },
    [],
  );
};

const installPackages = async (
  options: Input[],
  dryRunMode: boolean,
  installDirectory: string,
) => {
  const inputPackageManager: string = options.find(
    option => option.name === 'package-manager',
  )!.value as string;

  let packageManager: AbstractPackageManager;
  if (dryRunMode) {
    console.info();
    console.info(chalk.green(messages.DRY_RUN_MODE));
    console.info();
    return;
  }
  if (inputPackageManager !== undefined) {
    try {
      packageManager = PackageManagerFactory.create(inputPackageManager);
      await packageManager.install(installDirectory, inputPackageManager);
    } catch (error) {
      if (error && error.message) {
        console.error(chalk.red(error.message));
      }
    }
  } else {
    packageManager = await selectPackageManager();
    await packageManager.install(
      installDirectory,
      packageManager.name.toLowerCase(),
    );
  }
};

const selectPackageManager = async (): Promise<AbstractPackageManager> => {
  const answers: Answers = await askForPackageManager();
  return PackageManagerFactory.create(answers['package-manager']);
};

const askForPackageManager = async (): Promise<Answers> => {
  const questions: Question[] = [
    generateSelect('package-manager')(messages.PACKAGE_MANAGER_QUESTION)([
      PackageManager.NPM,
      PackageManager.YARN,
    ]),
  ];
  const prompt = inquirer.createPromptModule();
  return await prompt(questions);
};

const initializeGitRepository = async (dir: string) => {
  const runner = new GitRunner();
  await runner.run('init', true, join(process.cwd(), dir)).catch(() => {
    console.error(chalk.red(messages.GIT_INITIALIZATION_ERROR));
  });
};

const printCollective = () => {
  const dim = print('dim');
  const yellow = print('yellow');
  const emptyLine = print();

  emptyLine();
  yellow(`Thanks for installing Nest ${emojis.PRAY}`);
  dim('Please consider donating to our open collective');
  dim('to help us maintain this package.');
  emptyLine();
  emptyLine();
  print()(
    `${chalk.bold(`${emojis.WINE}  Donate:`)} ${chalk.underline(
      'https://opencollective.com/nest',
    )}`,
  );
  emptyLine();
};

const print = (color: string | null = null) => (str = '') => {
  const terminalCols = retrieveCols();
  const strLength = str.replace(/\u001b\[[0-9]{2}m/g, '').length;
  const leftPaddingLength = Math.floor((terminalCols - strLength) / 2);
  const leftPadding = ' '.repeat(Math.max(leftPaddingLength, 0));
  if (color) {
    str = (chalk as any)[color](str);
  }
  console.log(leftPadding, str);
};

export const retrieveCols = () => {
  const defaultCols = 80;
  try {
    const terminalCols = execSync('tput cols', {
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return parseInt(terminalCols.toString(), 10) || defaultCols;
  } catch {
    return defaultCols;
  }
};

export const exit = () => process.exit(1);
