import { green } from 'ansis';
import { EMOJIS } from './emojis.js';

export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'What name would you like to use for the new project?',
  PROJECT_SELECTION_QUESTION: 'Which project would you like to generate to?',
  LIBRARY_PROJECT_SELECTION_QUESTION:
    'Which project would you like to add the library to?',
  DRY_RUN_MODE: 'Command has been executed in dry run mode, nothing changed!',
  PROJECT_INFORMATION_START: `${EMOJIS.SPARKLES}  We will scaffold your app in a few seconds..`,
  RUNNER_EXECUTION_ERROR: (command: string) =>
    `\nFailed to execute command: ${command}`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${EMOJIS.HEART}  to use?`,
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
  OBSERVABILITY_KEYS_HINT:
    'Or create a free account at https://observe.nestjs.com and paste the app key and secret into ObserveModule.forRoot() in your AppModule.',

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
