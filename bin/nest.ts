#!/usr/bin/env node
import * as program from 'caporal';
import { CommandLoader } from '../commands';

const bootstrap = () => {
  program
    .version(require('../package.json').version)
    .description(require('../package.json').description);
  CommandLoader.load(program);
  program.parse(process.argv);
}

bootstrap();
