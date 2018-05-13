#!/usr/bin/env node
import * as commander from 'commander';
import { CommandLoader } from '../commands';
import { CommanderStatic } from 'commander';

const bootstrap = () => {
  const program: CommanderStatic = commander;
  program
    .version(require('../package.json').version)
  CommandLoader.load(program);
  commander.parse(process.argv);
}

bootstrap();
