import chalk from 'chalk';
import { EMOJIS } from './emojis';

export const MESSAGES = {
  PROJECT_SELECTION_QUESTION: 'Which project would you like to generate to?',
  DRY_RUN_MODE: 'Command has been executed in the dry mode, nothing changed!',
  PROJECT_INFORMATION_START: `${EMOJIS.ZAP}  We will scaffold your app in a few seconds..`,
  RUNNER_EXECUTION_ERROR: (command: string) =>
    `\nFailed to execute command: ${command}`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${EMOJIS.HEART} to use?`,
  PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: `Installation in progress... ${EMOJIS.COFFEE}`,
  PACKAGE_MANAGER_UPDATE_IN_PROGRESS: `Installation in progress... ${EMOJIS.COFFEE}`,
  PACKAGE_MANAGER_UPGRADE_IN_PROGRESS: `Installation in progress... ${EMOJIS.COFFEE}`,
  GIT_INITIALIZATION_ERROR: 'Git repository has not been initialized',
  PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name: string) =>
    `${EMOJIS.ROCKET}  Successfully created project ${chalk.green(name)}`,
  GET_STARTED_INFORMATION: `${EMOJIS.POINT_RIGHT}  Get started with the following commands:`,
  CHANGE_DIR_COMMAND: (name: string) => `$ cd ${name}`,
  START_COMMAND: (name: string) => `$ ${name} run start`,
  PACKAGE_MANAGER_INSTALLATION_FAILED: `${EMOJIS.SCREAM}  Packages installation failed, see above`,
  // tslint:disable-next-line:max-line-length
  NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${EMOJIS.SMIRK}  cannot read your project package.json file, are you inside your project directory?`,
};
