#!/usr/bin/env node
import * as commander from 'commander';
import { CommandLoader } from '../commands';

const bootstrap = () => {
  // program
  //   .version(require('../package.json').version)
  //   .description(require('../package.json').description);
  // CommandLoader.load(program);
  // program.parse(process.argv);
  commander
    .version(require('../package.json').version)
  commander.parse(process.argv);
}

bootstrap();
