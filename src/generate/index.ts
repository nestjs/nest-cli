module.exports = (program) => {
  program
    .command('generate', 'Generate a new Nest asset')
    .alias('g')
    // .argument('<assetType>', 'The generated asset type')
    // .argument('<assetName>', 'The generated asset name')
    // .argument('[moduleName]', 'The module name where the asset will be declared in')
    .action((args, options, logger) => {
      logger.info('Inside generate command handler');
    });
};
