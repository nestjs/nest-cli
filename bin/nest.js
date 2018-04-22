#!/usr/bin/env node
const program = require('caporal');
program
  .version(require('../package.json').version)
  .description(require('../package.json').description);
require('../commands/new')(program);
require('../commands/generate')(program);
require('../commands/info')(program);

const { Runner, RunnerFactory } = require('../lib/runners');
program
  .command('test')
  .action((args, options, logger) => {
    const runner = RunnerFactory.create(Runner.SCHEMATIC, logger);
    logger.info(runner);
  });

program.parse(process.argv);
