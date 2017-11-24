module.exports = (program) => {
  program
    .command('update', 'Update the Nest project')
    .action((args, options, logger) => {
      logger.info('Inside update command handler');
    });
};
