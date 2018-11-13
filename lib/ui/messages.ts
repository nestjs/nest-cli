import chalk from 'chalk';
import { emojis } from './emojis';

export const messages = {
  PROJECT_INFORMATION_START: `${emojis.ZAP}  Creating your Nest project...`,
  ADDITIONAL_INFORMATION: `${
    emojis.RAISED_HANDS
  }  We have to collect additional information:`,
  PROJECT_INFORMATION_COLLECTED: `${emojis.BOOM}  Thank you for your time!`,
  DRY_RUN_MODE: 'Command has been executed in the dry mode, nothing changed!',
  RUNNER_EXECUTION_ERROR: (command: string) =>
    `Failed to execute command: ${command}`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${
    emojis.HEART
  }  to use?`,
  PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: `Installation in progress... ${
    emojis.COFFEE
  }`,
  PACKAGE_MANAGER_UPDATE_IN_PROGRESS: `Installation in progress... ${
    emojis.COFFEE
  }`,
  PACKAGE_MANAGER_UPGRADE_IN_PROGRESS: `Installation in progress... ${
    emojis.COFFEE
  }`,
  PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name: string) =>
    `${emojis.ROCKET}  Successfully created project ${chalk.green(name)}`,
  GET_STARTED_INFORMATION: `${
    emojis.POINT_RIGHT
  }  Get started with the following commands:`,
  CHANGE_DIR_COMMAND: (name: string) => `$ cd ${name}`,
  START_COMMAND: (name: string) => `$ ${name} run start`,
  PACKAGE_MANAGER_INSTALLATION_FAILED: `${
    emojis.SCREAM
  }  Packages installation failed, see above`,
  NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${
    emojis.SMIRK
  }  cannot read your project package.json file, are you inside your project directory?`,
};
