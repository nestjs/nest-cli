import { emojis } from './emojis';
import chalk from 'chalk';

export const messages = {
  PROJECT_INFORMATION_START: `${ emojis.ZAP }  Creating your Nest project...`,
  ADDITIONAL_INFORMATION: `${ emojis.RAISED_HANDS }  We have to collect additional information:`,
  PROJECT_INFORMATION_COLLECTED: `${ emojis.BOOM }  Thank you for your time!`,
  DRY_RUN_MODE: 'Command has been executed in the dry mode, nothing changed!',
  RUNNER_EXECUTION_ERROR: (command) => `${ emojis.SCREAM }  Failed to execute command: ${ command }`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${ emojis.HEART }  to use?`,
  PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: `Take ${ emojis.COFFEE }  or ${ emojis.BEER }  during the packages installation process and enjoy your time`,
  PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name) => `${ emojis.ROCKET }  Successfully created project ${chalk.green(name)}`,
  GET_STARTED_INFORMATION: `${ emojis.POINT_RIGHT }  Get started with the following commands:`,
  CHANGE_DIR_COMMAND: (name) => `$ cd ${name}`,
  START_COMMAND: `$ npm run start`,
  PACKAGE_MANAGER_INSTALLATION_FAILED: `${ emojis.SCREAM }  Packages installation failed, see above`,
  NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${ emojis.SMIRK }  cannot read your project package.json file, are you sure that you're inside your project directory?`
};