import { dasherize } from '@angular-devkit/core/src/utils/strings';
import * as chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import { join } from 'path';
import { promisify } from 'util';
import { Input } from '../commands';
import { defaultGitIgnore } from '../lib/configuration/defaults';
import { PackageManager, PackageManagerFactory } from '../lib/package-managers';
import { generateInput, generateSelect } from '../lib/questions/questions';
import { GitRunner } from '../lib/runners/git.runner';
import {
  Collection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics';
import { EMOJIS, MESSAGES } from '../lib/ui';
import { AbstractAction } from './abstract.action';

export class NewAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    const directoryOption = options.find(
      (option) => option.name === 'directory',
    );
    const dryRunOption = options.find((option) => option.name === 'dry-run');
    const isDryRunEnabled = dryRunOption && dryRunOption.value;

    await askForMissingInformation(inputs, options);
    await generateApplicationFiles(inputs, options).catch(exit);

    const shouldSkipInstall = options.some(
      (option) => option.name === 'skip-install' && option.value === true,
    );
    const shouldSkipGit = options.some(
      (option) => option.name === 'skip-git' && option.value === true,
    );
    const projectDirectory = getProjectDirectory(
      getApplicationNameInput(inputs)!,
      directoryOption,
    );

    if (!shouldSkipInstall) {
      await installPackages(
        options,
        isDryRunEnabled as boolean,
        projectDirectory,
      );
    }
    if (!isDryRunEnabled) {
      if (!shouldSkipGit) {
        await initializeGitRepository(projectDirectory);
        await createGitIgnoreFile(projectDirectory);
      }

      printCollective();
    }
    process.exit(0);
  }
}

const getProjectDirectory = (
  applicationName: Input,
  directoryOption?: Input,
): string => {
  return (
    (directoryOption && (directoryOption.value as string)) ||
    dasherize(applicationName.value as string)
  );
};

const getApplicationNameInput = (inputs: Input[]): Input | undefined =>
  inputs.find((input) => input.name === 'name');

const getPackageManagerOption = (options: Input[]): Input | undefined =>
  options.find((option) => option.name === 'packageManager');

const getPackageManagerName = (options: Input[]): string => {
  const packageManager = getPackageManagerOption(options);
  return (
    (packageManager?.value as string) || PackageManager.NPM
  ).toLowerCase();
};

/**
 * Prompt the user to ask for mandatory inputs/options values, which are:
 * application name and package manager name.
 */
const askForMissingInformation = async (inputs: Input[], options: Input[]) => {
  console.info(MESSAGES.PROJECT_INFORMATION_START);
  console.info();

  const prompt = inquirer.createPromptModule();

  const nameInput = getApplicationNameInput(inputs);
  if (!nameInput!.value) {
    const answers = await askForApplicationNameUsingPrompt(prompt);
    replaceInputMissingInformation(inputs, answers);
  }

  const packageManagerInput = getPackageManagerOption(options);
  if (!packageManagerInput!.value) {
    const answers = await askForPackageManagerUsingPrompt(prompt);
    replaceInputMissingInformation(options, answers);
  }
};

const replaceInputMissingInformation = (
  inputs: Input[],
  answers: inquirer.Answers,
): void => {
  inputs.forEach(
    (input) =>
      (input.value =
        input.value !== undefined ? input.value : answers[input.name]),
  );
};

const generateApplicationFiles = async (args: Input[], options: Input[]) => {
  const collectionName = options.find(
    (option) => option.name === 'collection' && option.value != null,
  )!.value;
  const collection = CollectionFactory.create(
    (collectionName as Collection) || Collection.NESTJS,
  );
  const schematicOptions = mapSchematicOptions(args.concat(options));
  await collection.execute('application', schematicOptions);
  console.info();
};

const mapSchematicOptions = (options: Input[]): SchematicOption[] => {
  const optionsToExclude = ['skip-install', 'skip-git'];

  return options.reduce((schematicOptions, option: Input) => {
    if (!optionsToExclude.includes(option.name)) {
      schematicOptions.push(new SchematicOption(option.name, option.value));
    }
    return schematicOptions;
  }, [] as SchematicOption[]);
};

const installPackages = async (
  options: Input[],
  dryRunMode: boolean,
  installDirectory: string,
) => {
  if (dryRunMode) {
    console.info();
    console.info(chalk.green(MESSAGES.DRY_RUN_MODE));
    console.info();
    return;
  }

  try {
    const inputPackageManager = getPackageManagerName(options);
    const packageManager = PackageManagerFactory.create(inputPackageManager);
    await packageManager.install(installDirectory, inputPackageManager);
  } catch (error: any) {
    if (error && error.message) {
      console.error(chalk.red(error.message));
    }
  }
};

const askForApplicationNameUsingPrompt = async (
  prompt: inquirer.PromptModule,
): Promise<inquirer.Answers> => {
  const questions: inquirer.Question[] = [
    generateInput('name', MESSAGES.APPLICATION_NAME_QUESTION)('nest-app'),
  ];

  return prompt(questions as ReadonlyArray<inquirer.Question>);
};

const askForPackageManagerUsingPrompt = async (
  prompt: inquirer.PromptModule,
): Promise<inquirer.Answers> => {
  const questions: inquirer.Question[] = [
    generateSelect('packageManager')(MESSAGES.PACKAGE_MANAGER_QUESTION)([
      PackageManager.NPM,
      PackageManager.YARN,
      PackageManager.PNPM,
    ]),
  ];

  return prompt(questions);
};

const initializeGitRepository = async (dir: string) => {
  const runner = new GitRunner();
  await runner.run('init', true, join(process.cwd(), dir)).catch(() => {
    console.error(chalk.red(MESSAGES.GIT_INITIALIZATION_ERROR));
  });
};

/**
 * Write a file `.gitignore` in the root of the newly created project.
 * `.gitignore` available in `@nestjs/schematics` cannot be published to
 * NPM (needs to be investigated).
 *
 * @param dir Relative path to the project.
 * @param content (optional) Content written in the `.gitignore`.
 *
 * @return Resolves when succeeds, or rejects with any error from `fn.writeFile`.
 */
const createGitIgnoreFile = (dir: string, content?: string) => {
  const fileContent = content || defaultGitIgnore;
  const filePath = join(process.cwd(), dir, '.gitignore');
  return promisify(fs.writeFile)(filePath, fileContent);
};

const printCollective = () => {
  const dim = print('dim');
  const yellow = print('yellow');
  const emptyLine = print();

  emptyLine();
  yellow(`Thanks for installing Nest ${EMOJIS.PRAY}`);
  dim('Please consider donating to our open collective');
  dim('to help us maintain this package.');
  emptyLine();
  emptyLine();
  print()(
    `${chalk.bold(`${EMOJIS.WINE}  Donate:`)} ${chalk.underline(
      'https://opencollective.com/nest',
    )}`,
  );
  emptyLine();
};

const print =
  (color: string | null = null) =>
  (str = '') => {
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
