#!/usr/bin/env node
const program = require('caporal');
const { CommandLoader } = require('../commands');
program
  .version(require('../package.json').version)
  .description(require('../package.json').description);
// require('../commands/new')(program);
// require('../commands/generate')(program);
// require('../commands/info')(program);
CommandLoader.load(program);
program.parse(process.argv);
