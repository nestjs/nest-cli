import { Command } from 'commander';
import { Collection } from '../lib/schematics/collection.js';
import { ERROR_PREFIX, MESSAGES } from '../lib/ui/index.js';
import { disablePrompts } from '../lib/utils/is-interactive.js';
import { AbstractCommand } from './abstract.command.js';
import { NewCommandContext } from './context/index.js';

export class NewCommand extends AbstractCommand {
  public load(program: Command) {
    program
      .command('new [name]')
      .alias('n')
      .description('Generate Nest application.')
      .option('--directory [directory]', 'Specify the destination directory')
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
        false,
      )
      .option('-g, --skip-git', 'Skip git repository initialization.', false)
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option(
        '-p, --package-manager [packageManager]',
        'Specify package manager.',
      )
      .option(
        '-l, --language [language]',
        'Programming language to be used (TypeScript or JavaScript)',
        'TypeScript',
      )
      .option(
        '-c, --collection [collectionName]',
        'Schematics collection to use',
        Collection.NESTJS,
      )
      .option('--strict', 'Enables strict mode in TypeScript.', true)
      .option(
        '-t, --skip-tests',
        'Create the project without tests: no spec or e2e files, no Vitest/Jest config, test scripts or test dependencies. Unlike --minimal, keeps the module, controller and service files.',
        false,
      )
      .option(
        '--type [type]',
        'Module system: esm (tested with Vitest, the default) or cjs (tested with Jest).',
      )
      .option('--format', 'Format generated files using Prettier.', false)
      .option('--observe', 'Auto-configure observability with @nestjs/observe.')
      .option(
        '--no-observe',
        'Skip observability setup without being prompted for it.',
      )
      .option(
        '--minimal',
        'Generate an application whose code is one file, src/main.ts, with no tests, linter or formatter (TypeScript and ESM only).',
        false,
      )
      .option(
        '--no-interactive',
        'Never prompt: use the default for every question not answered by a flag (also the case without a TTY or under CI).',
      )
      .action(async (name: string, options: Record<string, any>) => {
        const availableLanguages = ['js', 'ts', 'javascript', 'typescript'];

        let language = options.language;
        if (language) {
          const lowercasedLanguage = language.toLowerCase();
          const langMatch = availableLanguages.includes(lowercasedLanguage);
          if (!langMatch) {
            throw new Error(
              `Invalid language "${language}" selected. Available languages are "typescript" or "javascript"`,
            );
          }
          switch (lowercasedLanguage) {
            case 'javascript':
              language = 'js';
              break;
            case 'typescript':
              language = 'ts';
              break;
            default:
              language = lowercasedLanguage;
              break;
          }
        }

        const type =
          typeof options.type === 'string'
            ? options.type.toLowerCase()
            : undefined;
        if (options.type !== undefined && type !== 'esm' && type !== 'cjs') {
          console.error(
            `${ERROR_PREFIX} ${MESSAGES.MODULE_TYPE_INVALID(String(options.type))}`,
          );
          process.exit(1);
        }
        if (options.minimal && type === 'cjs') {
          console.error(
            `${ERROR_PREFIX} ${MESSAGES.MINIMAL_COMMONJS_UNSUPPORTED}`,
          );
          process.exit(1);
        }
        if (options.interactive === false) {
          disablePrompts();
        }

        if (options.minimal && language === 'js') {
          console.error(
            `${ERROR_PREFIX} ${MESSAGES.MINIMAL_JAVASCRIPT_UNSUPPORTED}`,
          );
          process.exit(1);
        }

        const context: NewCommandContext = {
          name,
          directory: options.directory,
          dryRun: options.dryRun,
          skipGit: options.skipGit,
          skipInstall: options.skipInstall,
          skipTests: options.skipTests,
          packageManager: options.packageManager,
          language,
          collection: options.collection,
          strict: options.strict,
          format: options.format === true,
          // Stays undefined unless a flag was given, which is what tells the
          // action to prompt instead of assuming an answer.
          observe: options.observe,
          minimal: options.minimal,
          type,
        };

        await this.action.handle(context);
      });
  }
}
