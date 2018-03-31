const inquirer = require('inquirer');
const chalk = require('chalk');
const Schematic = require('../schematics/schematic');
const SchematicRunner = require('../schematics/runner');
const NpmInstaller = require('../tasks/npm.installer');
const YarnInstaller = require('../tasks/yarn.installer');

module.exports = (args, options, logger) => {
  const runner = new SchematicRunner(logger);
  const builder = Schematic
    .Builder()
    .withCollectionName('@nestjs/schematics')
    .withSchematicName('application')
    .withArgs(args)
    .withOptions(options);
  return runner
    .run(builder.build().command())
    .then(() => {
      if (!options[ 'dry-run' ]) {
        return selectPackageManager();
      }
    })
    .then((packageManager) => {
      switch (packageManager) {
        case 'npm':
          return new NpmInstaller(logger).install(args.directory);
        case 'yarn':
          return new YarnInstaller(logger).install(args.directory);
        default:
          logger.info(chalk.green('Command run in dry mode, nothing to change !'));
      }
    })
};

function selectPackageManager() {
  const question = {
    type: 'list',
    name: 'package-manager',
    message: 'Which package manager to use ?',
    choices: [ 'npm', 'yarn' ]
  };
  return inquirer.prompt(question).then((answer) => answer[ question.name ]);
}