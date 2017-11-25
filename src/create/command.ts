module.exports = (program) => {
  program
    .command('new', 'Create a new Nest application')
    .argument('<name>', 'Nest application name')
    .argument('[destination]', 'Where the Nest application will be created')
    .option('-r, --repository <repository>', 'Github repository where the project template is')
    .action((args, options, logger) => {
      logger.info('Inside create command handler');
    });
};