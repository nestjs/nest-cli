const emojis = require('./emojis');

module.exports = {
  PROJECT_INFORMATION_START: `${ emojis.SMIRK }  needs some information to create the project.`,
  PROJECT_INFORMATION_COLLECTED: `${ emojis.HEART_EYES }  thanks you for your time to provide these information.${ emojis.KISSING }`,
  DRY_RUN_MODE: 'Command run in dry mode, nothing changed !',
  RUNNER_EXECUTION_ERROR: (command) => `${ emojis.SCREAM }  Failed to execute command : ${ command }, see above.${ emojis.CRYING }  hopes we are not${ emojis.BROKEN_HEART }  ...`,
  PACKAGE_MANAGER_QUESTION: `Which package manager would you ${ emojis.HEART }  to use ?`,
  PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS: (name) => `You can take a ${ emojis.COFFEE }  or a${ emojis.BEER }  during packages installation for tooling via ${ name } as${ emojis.JOY }  recommandation.`,
  PACKAGE_MANAGER_INSTALLATION_SUCCEED: (name) => `${ emojis.SMILE }  installed packages for tooling via ${ name }. Enjoy the Nestjs experience${ emojis.HEART_EYES }`,
  PACKAGE_MANAGER_INSTALLATION_FAILED: `${ emojis.SCREAM }  Package installation failed, see above. ${ emojis.CRYING }  hopes we are not${ emojis.BROKEN_HEART }  ...`,
  NEST_INFORMATION_PACKAGE_MANAGER_FAILED: `${ emojis.SMIRK }  can not read your project package.json file, are you on your project folder ?${ emojis.SMILE }`
};