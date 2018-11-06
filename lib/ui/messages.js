"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const emojis_1 = require("./emojis");
exports.messages = {
    PROJECT_INFORMATION_START: `${emojis_1.emojis.ZAP}  Creating your Nest project...`,
    ADDITIONAL_INFORMATION: `${emojis_1.emojis.RAISED_HANDS}  We have to collect additional information:`,
    PROJECT_INFORMATION_COLLECTED: `${emojis_1.emojis.BOOM}  Thank you for your time!`,
    DRY_RUN_MODE: 'Command has been executed in the dry mode, nothing changed!',
    RUNNER_EXECUTION_ERROR: (command) => `Failed to execute command: ${command}`,
    PACKAGE_MANAGER_QUESTION: `Which package manager would you ${emojis_1.emojis.HEART}  to use?`,
    PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: `Take ${emojis_1.emojis.COFFEE}  or ${emojis_1.emojis.BEER}  during the packages installation process and enjoy your time`,
    PACKAGE_MANAGER_UPDATE_IN_PROGRESS: `Take ${emojis_1.emojis.COFFEE}  or ${emojis_1.emojis.BEER}  during the packages update process and enjoy your time`,
    PACKAGE_MANAGER_UPGRADE_IN_PROGRESS: `Take ${emojis_1.emojis.COFFEE}  or ${emojis_1.emojis.BEER}  during the packages upgrade process and enjoy your time`,
    PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name) => `${emojis_1.emojis.ROCKET}  Successfully created project ${chalk_1.default.green(name)}`,
    GET_STARTED_INFORMATION: `${emojis_1.emojis.POINT_RIGHT}  Get started with the following commands:`,
    CHANGE_DIR_COMMAND: (name) => `$ cd ${name}`,
    START_COMMAND: '$ npm run start',
    PACKAGE_MANAGER_INSTALLATION_FAILED: `${emojis_1.emojis.SCREAM}  Packages installation failed, see above`,
    NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${emojis_1.emojis.SMIRK}  cannot read your project package.json file, are you inside your project directory?`,
};
