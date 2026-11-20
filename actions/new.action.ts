import { confirm, input, select } from '@inquirer/prompts';
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
  describeSkippedPrompt,
  getSkippedPrompts,
  SchematicOption,
} from '../lib/schematics/index.js';
import { EMOJIS, MESSAGES } from '../lib/ui/index.js';
import { detectPackageManager } from '../lib/utils/detect-package-manager.js';
import { normalizeToKebabOrSnakeCase } from '../lib/utils/formatting.js';
import { gracefullyExitOnPromptError } from '../lib/utils/gracefully-exit-on-prompt-error.js';
import {
  AGENT_SKILLS_TARGETS,
  AgentSkillsTarget,
  DEFAULT_AGENT_SKILLS,
  installAgentSkills,
  printAgentSkillsNextSteps,
} from '../lib/utils/agent-skills.js';
import { isInteractive } from '../lib/utils/is-interactive.js';
import {
  offerObserveLink,
  printObservabilityNextSteps,
} from '../lib/utils/observe-link.js';
import { AbstractAction } from './abstract.action.js';

const DEFAULT_PROJECT_NAME = 'nest-app';

export class NewAction extends AbstractAction {
  public async handle(context: NewCommandContext) {
    await askForMissingInformation(context);
    await generateApplicationFiles(context).catch(exit);

    const projectDirectory = getProjectDirectory(context);

    if (isMinimalIgnored(context, projectDirectory)) {
      console.error(
        ansis.red(
          MESSAGES.MINIMAL_IGNORED(context.collection, projectDirectory),
        ),
      );
      return exit();
    }

    if (!context.skipInstall) {
      await installPackages(context, projectDirectory);
    }
    if (!context.dryRun) {
      const skills = context.skills ?? [];
      // Before `git init`, so the skills are part of the first commit.
      if (context.skipInstall) {
        printAgentSkillsNextSteps(
          skills,
          MESSAGES.AGENT_SKILLS_INSTALLATION_SKIPPED,
        );
      } else {
        await installAgentSkills(projectDirectory, skills);
      }
      if (!context.skipGit) {
        await initializeGitRepository(projectDirectory);
        await createGitIgnoreFile(projectDirectory);
      }

      if (context.observe) {
        const linked =
          !context.skipInstall && (await offerObserveLink(projectDirectory));
        if (!linked) {
          printObservabilityNextSteps();
        }
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

/**
 * A collection that doesn't know an option ignores it instead of failing, so
 * an older `@nestjs/schematics` answers `--minimal` with a standard project.
 */
const isMinimalIgnored = (context: NewCommandContext, directory: string) =>
  context.minimal &&
  !context.dryRun &&
  fileExists(join(process.cwd(), directory, 'src', 'app.module.ts'));

const askForMissingInformation = async (context: NewCommandContext) => {
  console.info(MESSAGES.PROJECT_INFORMATION_START);
  console.info();

  if (!context.name) {
    context.name = await askForProjectName();
  }

  if (!context.packageManager) {
    context.packageManager = (await askForPackageManager()) as string;
  }

  if (context.observe === undefined) {
    context.observe = await askForObservability();
  }

  if (context.skills === undefined) {
    context.skills = await askForAgentSkills();
  }
};

const generateApplicationFiles = async (context: NewCommandContext) => {
  const collectionName =
    (context.collection as Collection) || Collection.NESTJS;
  const collection: AbstractCollection =
    CollectionFactory.create(collectionName);
  const schematicOptions: SchematicOption[] =
    mapContextToSchematicOptions(context);
  if (isInteractive()) {
    await collection.execute('application', schematicOptions);
  } else {
    // The schematics binary only checks stdout, so with a terminal there but
    // nothing on stdin (a coding agent's shell) it would still ask, and fail.
    const skipped = await getSkippedPrompts(
      collectionName,
      'application',
      schematicOptions,
    );
    if (skipped.length > 0) {
      console.info(
        MESSAGES.SCHEMATIC_PROMPTS_DEFAULTED(
          skipped.map(describeSkippedPrompt),
        ),
      );
    }
    await collection.execute(
      'application',
      schematicOptions,
      '--no-interactive',
    );
  }
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

  if (context.dryRun) options.push(new SchematicOption('dry-run', true));
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

  if (context.observe) {
    options.push(new SchematicOption('observe', true));
  }
  // AGENTS.md gives the command that installs the skills. schematics-cli builds an
  // array only from a repeated flag (one `--skills=x` reaches the schema as a
  // string, which fails it), so a lone target is sent twice; the schematic
  // dedupes. No targets: nothing is sent, and the schematic's default is none.
  const skills = context.skills ?? [];
  for (const target of skills.length === 1 ? [...skills, ...skills] : skills) {
    options.push(new SchematicOption('skills', target));
  }
  if (context.minimal) {
    options.push(new SchematicOption('minimal', true));
    // Also keeps the schematic's module system prompt away: its choices are
    // named after test runners, and this project has none.
    options.push(new SchematicOption('type', 'esm'));
  } else if (context.type !== undefined) {
    options.push(new SchematicOption('type', context.type));
  }
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

const askForObservability = async (): Promise<boolean> => {
  // When not prompting (no TTY, CI, --no-interactive), take the prompt's own
  // default, yes, as with the agent skills: coding agents create most projects
  // this way, and the SDK sends nothing until the project is linked. The
  // message says how to link it, and --no-observe opts out.
  if (!isInteractive()) {
    console.info(MESSAGES.OBSERVABILITY_DEFAULTED);
    return true;
  }

  return (await confirm({
    message: MESSAGES.OBSERVABILITY_QUESTION,
    default: true,
  }).catch(gracefullyExitOnPromptError)) as boolean;
};

const askForAgentSkills = async (): Promise<AgentSkillsTarget[]> => {
  // Agents running `nest new` are the ones the skills help most, and they
  // rarely have a TTY, so the skills are on when not prompting.
  if (!isInteractive()) {
    console.info(MESSAGES.AGENT_SKILLS_DEFAULTED);
    return DEFAULT_AGENT_SKILLS;
  }

  const answer = (await select({
    message: MESSAGES.AGENT_SKILLS_QUESTION,
    choices: [
      ...Object.entries(AGENT_SKILLS_TARGETS).map(([value, description]) => ({
        name: `${value} - ${description}`,
        value,
      })),
      { name: 'none', value: 'none' },
    ],
    default: DEFAULT_AGENT_SKILLS[0],
  }).catch(gracefullyExitOnPromptError)) as AgentSkillsTarget | 'none';
  return !answer || answer === 'none' ? [] : [answer];
};

const askForProjectName = async () => {
  // Without a TTY (CI, piped input, a coding agent's shell) a prompt can only
  // fail, so take the answer that pressing enter would give.
  if (!isInteractive()) {
    console.info(MESSAGES.PROJECT_NAME_DEFAULTED(DEFAULT_PROJECT_NAME));
    return DEFAULT_PROJECT_NAME;
  }

  const question = generateInput(
    'name',
    MESSAGES.PROJECT_NAME_QUESTION,
  )(DEFAULT_PROJECT_NAME);
  return (await input(question).catch(gracefullyExitOnPromptError)) as
    string | undefined;
};

const askForPackageManager = async () => {
  if (!isInteractive()) {
    const packageManager = detectPackageManager();
    console.info(MESSAGES.PACKAGE_MANAGER_DEFAULTED(packageManager));
    return packageManager;
  }

  const question = generateSelect('packageManager')(
    MESSAGES.PACKAGE_MANAGER_QUESTION,
  )([
    PackageManager.NPM,
    PackageManager.YARN,
    PackageManager.PNPM,
    PackageManager.BUN,
  ]);

  return select(question).catch(gracefullyExitOnPromptError);
};

const initializeGitRepository = async (dir: string) => {
  // `nest new .` in a folder that is already a repository keeps it as it is.
  if (fileExists(join(process.cwd(), dir, '.git'))) {
    return;
  }
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
