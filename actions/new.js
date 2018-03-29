const path = require('path');
const Schematic = require('../schematics/schematic');
const SchematicRunner = require('../schematics/runner');
const NpmInstaller = require('../tasks/npm.installer');

module.exports = (args, options, logger) => {
  const runner = new SchematicRunner(logger);
  const installer = new NpmInstaller(logger);
  const builder = Schematic
    .Builder()
    .withCollectionName(path.join(__dirname, '..'))
    .withSchematicName('application')
    .withArgs(args)
    .withOptions(options);
  return runner.run(builder.build().command())
    .then(() => {
      if (!options['dry-run']) {
        return installer.install(args.directory);
      }
    });
};