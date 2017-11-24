module.exports = (program) => {
  program
    .command('serve', 'Run a live-reloading development server.')
    .action((args, options, logger) => {
      logger.info('Inside info command handler');
    });
};
