import chalk from 'chalk';
import { emojis } from './emojis';

export const messages = {
  DRY_RUN_MODE: 'Command has been executed in the dry mode, nothing changed!',
  PROJECT_INFORMATION_START: `${emojis.ZAP}  We will scaffold your app in a few seconds..`,
  RUNNER_EXECUTION_ERROR: (command: string) =>
    `\nFailed to execute command: ${command}`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${emojis.HEART} to use?`,
  PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: `Installation in progress... ${emojis.COFFEE}`,
  PACKAGE_MANAGER_UPDATE_IN_PROGRESS: `Installation in progress... ${emojis.COFFEE}`,
  PACKAGE_MANAGER_UPGRADE_IN_PROGRESS: `Installation in progress... ${emojis.COFFEE}`,
  GIT_INITIALIZATION_ERROR: 'Git repository has not been initialized',
  PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name: string) =>
    `${emojis.ROCKET}  Successfully created project ${chalk.green(name)}`,
  GET_STARTED_INFORMATION: `${emojis.POINT_RIGHT}  Get started with the following commands:`,
  CHANGE_DIR_COMMAND: (name: string) => `$ cd ${name}`,
  START_COMMAND: (name: string) => `$ ${name} run start`,
  PACKAGE_MANAGER_INSTALLATION_FAILED: `${emojis.SCREAM}  Packages installation failed, see above`,
  // tslint:disable-next-line:max-line-length
  NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${emojis.SMIRK}  cannot read your project package.json file, are you inside your project directory?`,
};
