import { green } from 'ansis';
import { EMOJIS } from './emojis.js';

export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'What name would you like to use for the new project?',
  PROJECT_NAME_DEFAULTED: (name: string) =>
    `Not prompting, so the project is called ${name}. Pass a name to choose another.`,
  PROJECT_SELECTION_QUESTION: 'Which project would you like to generate to?',
  LIBRARY_PROJECT_SELECTION_QUESTION:
    'Which project would you like to add the library to?',
  DRY_RUN_MODE: 'Command has been executed in dry run mode, nothing changed!',
  PROJECT_INFORMATION_START: `${EMOJIS.SPARKLES}  We will scaffold your app in a few seconds..`,
  RUNNER_EXECUTION_ERROR: (command: string) =>
    `\nFailed to execute command: ${command}`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${EMOJIS.HEART}  to use?`,
  PACKAGE_MANAGER_DEFAULTED: (name: string) =>
    `Not prompting, so using ${name}. Pass --package-manager to choose another.`,
  PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: `Installation in progress... ${EMOJIS.COFFEE}`,
  PACKAGE_MANAGER_UPDATE_IN_PROGRESS: `Installation in progress... ${EMOJIS.COFFEE}`,
  PACKAGE_MANAGER_UPGRADE_IN_PROGRESS: `Installation in progress... ${EMOJIS.COFFEE}`,
  PACKAGE_MANAGER_PRODUCTION_INSTALLATION_IN_PROGRESS: `Package installation in progress... ${EMOJIS.COFFEE}`,
  GIT_INITIALIZATION_ERROR: 'Git repository has not been initialized',
  PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name: string) =>
    name !== '.'
      ? `${EMOJIS.ROCKET}  Successfully created project ${green(name)}`
      : `${EMOJIS.ROCKET}  Successfully created a new project`,
  GET_STARTED_INFORMATION: `${EMOJIS.POINT_RIGHT}  Get started with the following commands:`,
  CHANGE_DIR_COMMAND: (name: string) => `$ cd ${name}`,
  START_COMMAND: (name: string) => `$ ${name} run start`,
  PACKAGE_MANAGER_INSTALLATION_FAILED: (commandToRunManually: string) =>
    `${EMOJIS.SCREAM}  Packages installation failed!\nIn case you don't see any errors above, consider manually running the failed command ${commandToRunManually} to see more details on why it errored out.`,
  NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${EMOJIS.SMIRK}  cannot read your project package.json file, are you inside your project directory?`,
  NEST_INFORMATION_PACKAGE_WARNING_FAILED: (nestDependencies: string[]) =>
    `${
      EMOJIS.SMIRK
    }  failed to compare dependencies versions, please check that following packages are in the same minor version : \n ${nestDependencies.join(
      '\n',
    )}`,

  LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE: (name: string) =>
    `Unable to install library ${name} because package did not install. Please check package name.`,
  LIBRARY_INSTALLATION_FAILED_NO_LIBRARY: 'No library found.',
  LIBRARY_INSTALLATION_STARTS: 'Starting library setup...',
  LIBRARY_INSTALLATION_DRY_RUN: (name: string) =>
    `Dry run: skipping installation of ${name}.`,
  LIBRARY_NOT_INSTALLED_DRY_RUN: (name: string) =>
    `${name} is not installed, so its setup cannot be previewed. Run the command without --dry-run to install and set it up.`,

  UPGRADE_IN_PROGRESS: `${EMOJIS.ROCKET}  Upgrading your project to NestJS v12...`,
  UPGRADE_GLOBAL_CLI_HINT:
    'Only the local @nestjs/cli was updated. To update a globally installed CLI, run: npm i -g @nestjs/cli@latest',

  OBSERVABILITY_QUESTION:
    'Would you like to set up @nestjs/observe (distributed tracing, auto-correlated logs, metrics and alarms - free for 300k events/month, https://observe.nestjs.com)?',

  OBSERVABILITY_LINK_QUESTION:
    'Link this project to NestJS Observe now? You approve a code in the browser (signing up for free if needed), and the key pair is written into .env.',
  OBSERVABILITY_NEXT_STEPS: `${EMOJIS.SPARKLES}  @nestjs/observe is wired up. To connect it, run this in the project and approve the code it prints:`,
  OBSERVABILITY_LINK_COMMAND: 'npx @nestjs/observe link',
  OBSERVABILITY_AGENT_HINT:
    "Coding agent? If you can leave a command running in the background, start `npx @nestjs/observe link --no-browser` in the project and give the user the address and code it prints: they approve it in the browser, and it writes the key pair into .env. Otherwise, tell the user to run `npx @nestjs/observe link`. Don't write the keys yourself.",
  OBSERVABILITY_KEYS_HINT:
    'Or create a free account at https://observe.nestjs.com and paste the app key and secret into ObserveModule.forRoot() in your AppModule.',
  OBSERVABILITY_UPGRADE_KEYS_HINT:
    'Or create a free account at https://observe.nestjs.com, issue an API key, and set OBSERVE_APP_KEY and OBSERVE_APP_SECRET in the environment.',

  AGENT_SKILLS_QUESTION:
    'Which coding agents should get the official NestJS agent skills?',
  AGENT_SKILLS_DEFAULTED:
    'Not prompting, so adding the NestJS agent skills for Codex, Cursor and Claude Code. Pass --skills to choose others, or --skip-skills for none.',
  AGENT_SKILLS_INSTALLATION_IN_PROGRESS: `${EMOJIS.SPARKLES}  Adding the NestJS agent skills...`,
  AGENT_SKILLS_INSTALLATION_FAILED:
    'The NestJS agent skills could not be added (offline?). To add them later, run this in the project:',
  AGENT_SKILLS_INSTALLATION_SKIPPED:
    'Packages were not installed, so neither were the NestJS agent skills. To add them, run this in the project:',

  MINIMAL_JAVASCRIPT_UNSUPPORTED:
    '--minimal is TypeScript only: JavaScript needs Babel and its own entry file to run decorators, so the project would not stay one file. Drop --language js, or drop --minimal for a standard JavaScript project.',
  MINIMAL_COMMONJS_UNSUPPORTED:
    '--minimal is ESM only. Drop --type cjs, or drop --minimal for a standard CommonJS project.',
  MODULE_TYPE_INVALID: (type: string) =>
    `Invalid module system "${type}". Use --type esm (with Vitest) or --type cjs (with Jest).`,
  OBSERVABILITY_DEFAULTED:
    'Not prompting, so @nestjs/observe is set up (it sends nothing until you run npx @nestjs/observe link). Pass --no-observe to skip it.',
  PROJECT_SELECTION_DEFAULTED: (project: string) =>
    `Not prompting, so generating in the default project, ${project}. Pass --project to choose another.`,
  SCHEMATIC_PROMPTS_DEFAULTED: (answers: string[]) =>
    `Not prompting, so using the defaults: ${answers.join(', ')}. Pass the flags to choose otherwise.`,
  SCHEMATIC_NAME_REQUIRED: (schematic: string) =>
    `Not prompting, so the name has to be given. Pass it as an argument, e.g. nest generate ${schematic} <name>.`,
  MINIMAL_IGNORED: (collection: string, directory: string) =>
    `This version of ${collection} does not support --minimal, so it generated a standard project in ${directory}. Delete that folder, update ${collection} (npx @nestjs/cli@latest uses the newest one), and run this again.`,

  MAU_INSTALLATION_QUESTION: (name: string) =>
    `The ${name} package is required to deploy. Would you like to install it now?`,
  MAU_INSTALLATION_IN_PROGRESS: (name: string) =>
    `Installing ${name}... ${EMOJIS.COFFEE}`,
  MAU_INSTALLATION_DECLINED: (name: string, command: string) =>
    `Cannot deploy without ${name}. Install it with:\n\n  ${command}\n`,
  MAU_INSTALLATION_FAILED: (name: string) =>
    `Failed to install ${name}. Please install it manually and try again.`,
  MAU_NOT_INSTALLED_NON_INTERACTIVE: (name: string, command: string) =>
    `The ${name} package is required to deploy, and there is no TTY available to confirm installing it. Install it with:\n\n  ${command}\n`,
};
