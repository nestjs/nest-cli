#!/usr/bin/env node
import * as commander from 'commander';
import { CommandLoader } from '../commands';
import { CommanderStatic } from 'commander';

const bootstrap = () => {
  // program
  //   .version(require('../package.json').version)
  //   .description(require('../package.json').description);
  // CommandLoader.load(program);
  // program.parse(process.argv);
  const program: CommanderStatic = commander;
  program
    .version(require('../package.json').version)
  CommandLoader.load(program);
  commander.parse(process.argv);
}

bootstrap();
