#!/usr/bin/env node
const program = require('caporal');
program
  .version(require('../package.json').version)
  .description(require('../package.json').description);
require('../commands/new')(program);
require('../commands/generate')(program);
require('../commands/info')(program);

const { PackageManager, PackageManagerFactory } = require('../lib/package-managers');
program
  .command('test')
  .action((args, options, logger) => {
    const manager = PackageManagerFactory.create(PackageManager.YARN, logger);
    logger.info(manager);
  });

program.parse(process.argv);
