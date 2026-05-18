#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'module';
import { CommandLoader } from '../commands/index.js';
import {
  loadLocalBinCommandLoader,
  localBinExists,
} from '../lib/utils/local-binaries.js';

const require = createRequire(import.meta.url);

const bootstrap = async () => {
  const program = new Command();
  (program as any).__nestCliEsm = true;
  program
    .version(
      require('../package.json').version,
      '-v, --version',
      'Output the current version.',
    )
    .usage('<command> [options]')
    .helpOption('-h, --help', 'Output usage information.');

  if (localBinExists()) {
    const localCommandLoader = await loadLocalBinCommandLoader();
    await localCommandLoader.load(program);
  } else {
    await CommandLoader.load(program);
  }
  await program.parseAsync(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

bootstrap();
