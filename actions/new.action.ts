import { input, select } from '@inquirer/prompts';
import ansis, { type AnsiColors, type AnsiStyles } from 'ansis';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import { NewCommandContext } from '../commands/index.js';
import { defaultGitIgnore } from '../lib/configuration/defaults.js';
import {
  AbstractPackageManager,
  PackageManager,
  PackageManagerFactory,
} from '../lib/package-managers/index.js';
import { generateInput, generateSelect } from '../lib/questions/questions.js';
import { GitRunner } from '../lib/runners/git.runner.js';
import {
  AbstractCollection,
  Collection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics/index.js';
import { EMOJIS, MESSAGES } from '../lib/ui/index.js';
import { normalizeToKebabOrSnakeCase } from '../lib/utils/formatting.js';
import { gracefullyExitOnPromptError } from '../lib/utils/gracefully-exit-on-prompt-error.js';
import { AbstractAction } from './abstract.action.js';

export class NewAction extends AbstractAction {
  public async handle(context: NewCommandContext) {
    await askForMissingInformation(context);
    await generateApplicationFiles(context).catch(exit);

    const projectDirectory = getProjectDirectory(context);

    if (!context.skipInstall) {
      await installPackages(context, projectDirectory);
    }
    if (!context.dryRun) {
      if (!context.skipGit) {
        await initializeGitRepository(projectDirectory);
        await createGitIgnoreFile(projectDirectory);
      }

      printCollective();
    }
    process.exit(0);
  }
}

const getProjectDirectory = (context: NewCommandContext): string => {
  return (
    context.directory || normalizeToKebabOrSnakeCase(context.name as string)
  );
};

const askForMissingInformation = async (context: NewCommandContext) => {
  console.info(MESSAGES.PROJECT_INFORMATION_START);
  console.info();

  if (!context.name) {
    const message = MESSAGES.PROJECT_NAME_QUESTION;
    const question = generateInput('name', message)('nest-app');
    context.name = (await input(question).catch(
      gracefullyExitOnPromptError,
    )) as string | undefined;
  }

  if (!context.packageManager) {
    context.packageManager = (await askForPackageManager()) as string;
  }
};

const generateApplicationFiles = async (context: NewCommandContext) => {
  const collection: AbstractCollection = CollectionFactory.create(
    (context.collection as Collection) || Collection.NESTJS,
  );
  const schematicOptions: SchematicOption[] =
    mapContextToSchematicOptions(context);
  await collection.execute('application', schematicOptions);
  console.info();
};

const mapContextToSchematicOptions = (
  context: NewCommandContext,
): SchematicOption[] => {
  const options: SchematicOption[] = [];

  if (context.name !== undefined)
    options.push(new SchematicOption('name', context.name));
  if (context.directory !== undefined)
    options.push(new SchematicOption('directory', context.directory));

  if (context.dryRun)
    options.push(new SchematicOption('dry-run', true));
  options.push(new SchematicOption('skip-git', context.skipGit));
  options.push(new SchematicOption('strict', context.strict));

  if (context.skipTests) {
    options.push(new SchematicOption('spec', false));
  }

  if (context.packageManager !== undefined)
    options.push(new SchematicOption('packageManager', context.packageManager));
  if (context.collection !== undefined)
    options.push(new SchematicOption('collection', context.collection));

  options.push(new SchematicOption('language', context.language));
  options.push(new SchematicOption('format', context.format));
  // note: skip-install is intentionally excluded — not sent to schematics
  return options;
};

const installPackages = async (
  context: NewCommandContext,
  installDirectory: string,
) => {
  const inputPackageManager = context.packageManager as string;

  let packageManager: AbstractPackageManager;
  if (context.dryRun) {
    console.info();
    console.info(ansis.green(MESSAGES.DRY_RUN_MODE));
    console.info();
    return;
  }
  try {
    packageManager = PackageManagerFactory.create(inputPackageManager);
    await packageManager.install(installDirectory, inputPackageManager);
  } catch (error) {
    if (error instanceof Error) {
      console.error(ansis.red(error.message));
    }
  }
};

const askForPackageManager = async () => {
  const question = generateSelect('packageManager')(
    MESSAGES.PACKAGE_MANAGER_QUESTION,
  )([PackageManager.NPM, PackageManager.YARN, PackageManager.PNPM]);

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
  (color: AnsiColors | AnsiStyles | null = null) =>
  (str = '') => {
    const terminalCols = retrieveCols();
    // eslint-disable-next-line no-control-regex
    const strLength = str.replace(/\x1b\[[0-9]+m/g, '').length;
    const leftPaddingLength = Math.floor((terminalCols - strLength) / 2);
    const leftPadding = ' '.repeat(Math.max(leftPaddingLength, 0));
    if (color) {
      str = ansis[color](str);
    }
    console.log(leftPadding, str);
  };

export const retrieveCols = () => {
  const defaultCols = 80;
  // Prefer process.stdout.columns: it works on every platform (including
  // Windows, where `tput` is not available by default) and reflects the
  // actual terminal size instead of always falling back to the default.
  const stdoutCols = process.stdout.columns;
  if (typeof stdoutCols === 'number' && stdoutCols > 0) {
    return stdoutCols;
  }
  try {
    const terminalCols = execSync('tput cols', {
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return parseInt(terminalCols.toString(), 10) || defaultCols;
  } catch {
    return defaultCols;
  }
};

const fileExists = (path: string) => fs.existsSync(path);

export const exit = () => process.exit(1);
