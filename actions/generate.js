const path = require('path');
const SchematicRunner = require('../schematics/runner');
const Schematic = require('../schematics/schematic');

module.exports = (args, options, logger) => {
  const runner = new SchematicRunner(logger);
  const builder = Schematic
    .Builder()
    .withCollectionName(path.join(__dirname, '..'))
    .withSchematicName(args.schematic)
    .withArgs(parse(args))
    .withOptions(options);
  runner.run(builder.build());
};

function parse(args) {
  return Object.keys(args).reduce((parsed, key) => {
    if (key !== 'schematic') {
      parsed[key] = args[key];
    }
    return parsed;
  }, {})
}