#!/usr/bin/env node
const program = require('caporal');

program
  .version(require('../package.json').version)
  .description(require('../package.json').description);

program
  .command('new')
  .alias('n')
  .argument('<directory>', 'directory where Nestjs application will be created')
  .option('--dry-run', 'allow to test changes before execute command')
  .action(require('../actions/new'));

program
  .command('generate')
  .alias('g')
  .argument('<schematic>', 'Nestjs framework asset type', [ 'controller', 'module', 'service', ])
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
