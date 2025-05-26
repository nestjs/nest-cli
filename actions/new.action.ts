import { input, select } from '@inquirer/prompts';
import * as ansis from 'ansis';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { Answers } from 'inquirer';
import { join } from 'path';
import { Input } from '../commands';
import { defaultGitIgnore } from '../lib/configuration/defaults';
import {
  AbstractPackageManager,
  PackageManager,
  PackageManagerFactory,
} from '../lib/package-managers';
import { generateInput, generateSelect } from '../lib/questions/questions';
import { GitRunner } from '../lib/runners/git.runner';
import {
  AbstractCollection,
  Collection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics';
import { EMOJIS, MESSAGES } from '../lib/ui';
import { normalizeToKebabOrSnakeCase } from '../lib/utils/formatting';
import { gracefullyExitOnPromptError } from '../lib/utils/gracefully-exit-on-prompt-error';
import { AbstractAction } from './abstract.action';
import { assertNonArray } from '../lib/utils/type-assertions';

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

const getApplicationNameInput = (inputs: Input[]) =>
  inputs.find((input) => input.name === 'name');

const getPackageManagerInput = (inputs: Input[]) =>
  inputs.find((options) => options.name === 'packageManager');

const getProjectDirectory = (
  applicationName: Input,
  directoryOption?: Input,
): string => {
  return (
    (directoryOption && (directoryOption.value as string)) ||
    normalizeToKebabOrSnakeCase(applicationName.value as string)
  );
};

const askForMissingInformation = async (inputs: Input[], options: Input[]) => {
  console.info(MESSAGES.PROJECT_INFORMATION_START);
  console.info();

  const nameInput = getApplicationNameInput(inputs);
  if (!nameInput!.value) {
    const message = MESSAGES.PROJECT_NAME_QUESTION;
    const question = generateInput('name', message)('nest-app');
    const answer = await input(question).catch(gracefullyExitOnPromptError);
    replaceInputMissingInformation(inputs, { name: 'name', value: answer });
  }

  const packageManagerInput = getPackageManagerInput(options);

  if (!packageManagerInput!.value) {
    const answer = await askForPackageManager();
    replaceInputMissingInformation(options, {
      name: 'packageManager',
      value: answer,
    });
  }
};

const replaceInputMissingInformation = (
  inputs: Input[],
  answer: Answers,
): void => {
  const input = inputs.find((input) => input.name === answer.name);

  if (input) {
    input.value = input.value !== undefined ? input.value : answer.value;
  }
};

const generateApplicationFiles = async (args: Input[], options: Input[]) => {
  const collectionName = options.find(
    (option) => option.name === 'collection' && option.value != null,
  )!.value;
  const collection: AbstractCollection = CollectionFactory.create(
    (collectionName as Collection) || Collection.NESTJS,
  );
  const schematicOptions: SchematicOption[] = mapSchematicOptions(
    args.concat(options),
  );
  await collection.execute('application', schematicOptions);
  console.info();
};

const mapSchematicOptions = (options: Input[]): SchematicOption[] => {
  return options.reduce(
    (schematicOptions: SchematicOption[], option: Input) => {
      if (option.name !== 'skip-install') {
        assertNonArray(option.value);
        schematicOptions.push(new SchematicOption(option.name, option.value));
      }
      return schematicOptions;
    },
    [],
  );
};

const installPackages = async (
  options: Input[],
  dryRunMode: boolean,
  installDirectory: string,
) => {
  const inputPackageManager = getPackageManagerInput(options)!.value as string;

  let packageManager: AbstractPackageManager;
  if (dryRunMode) {
    console.info();
    console.info(ansis.green(MESSAGES.DRY_RUN_MODE));
    console.info();
    return;
  }
  try {
    packageManager = PackageManagerFactory.create(inputPackageManager);
    await packageManager.install(installDirectory, inputPackageManager);
  } catch (error) {
    if (error && error.message) {
      console.error(ansis.red(error.message));
    }
  }
};

const askForPackageManager = async () => {
  const question = generateSelect('packageManager')(
    MESSAGES.PACKAGE_MANAGER_QUESTION,
  )([PackageManager.NPM, PackageManager.YARN, PackageManager.PNPM, PackageManager.BUN]);

  return select(question).catch(gracefullyExitOnPromptError);
};

const initializeGitRepository = async (dir: string) => {
  const runner = new GitRunner();
  await runner.run('init', true, join(process.cwd(), dir)).catch(() => {
    console.error(ansis.red(MESSAGES.GIT_INITIALIZATION_ERROR));
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

  if (fileExists(filePath)) {
    return;
  }
  return fs.promises.writeFile(filePath, fileContent);
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
    `${ansis.bold`${EMOJIS.WINE}  Donate:`} ${ansis.underline(
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
      str = (ansis as any)[color](str);
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

const fileExists = (path: string) => {
  try {
    fs.accessSync(path);
    return true;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return false;
    }

    throw err;
  }
};

export const exit = () => process.exit(1);
