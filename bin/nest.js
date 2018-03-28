#!/usr/bin/env node
const program = require('caporal');

program
  .version(require('../package.json').version)
  .description(require('../package.json').description);

program
  .command('new')
  .alias('n')
  .argument('<name>', 'Nestjs application name')
  .action(require('../actions/new'));

program
  .command('generate')
  .alias('g')
  .argument('<asset>', 'Nestjs framework asset type', [ 'controller', 'module', 'service', ])
  .argument('<name>', 'Asset name or path')
  .argument('[path]', 'Path to generate the asset')
  .action((args, options, logger) => {
    logger.info(args);
    logger.info(options);
  });

program
  .command('info', 'Display Nest CLI information.')
  .action(require('../actions/info'));

program.parse(process.argv);
