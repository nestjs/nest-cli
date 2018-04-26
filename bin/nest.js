#!/usr/bin/env node
const program = require('caporal');
const { CommandLoader } = require('../commands');
program
  .version(require('../package.json').version)
  .description(require('../package.json').description);
CommandLoader.load(program);
program.parse(process.argv);
