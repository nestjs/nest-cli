const { COLLECTIONS, Schematic, SchematicOption } = require('../utils/schematics');

module.exports = (args, options, logger) => {
  return executeSchematic(args, options, logger);
};

function executeSchematic(args, options, logger) {
  const schematic = Schematic.create(COLLECTIONS.NESTJS, logger);
  const schematicOptions = Parser.parse(args, options);
  return schematic.execute(args.schematic, schematicOptions);
}

class Parser {
  static parse(args, options) {
    const schematicOptions = [];
    Object.keys(args).forEach((key) => {
      if (key !== 'schematic') {
        schematicOptions.push(new SchematicOption(key, args[ key ]));
      }
    });
    Object.keys(options).forEach((key) => {
      schematicOptions.push(new SchematicOption(key, options[ key ] !== undefined));
    });
    return schematicOptions;
  }
}