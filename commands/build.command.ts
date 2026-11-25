import { type Command, InvalidArgumentError } from 'commander';
import {
  AVAILABLE_BUILDERS,
  type BuilderVariant,
} from '../lib/configuration/index.js';
import { AbstractCommand } from './abstract.command.js';
import type { BuildCommandContext } from './context/index.js';

export class BuildCommand extends AbstractCommand {
  public load(program: Command): void {
    type BuildCommandOptions = {
      config?: string;
      path?: string;
      watch?: boolean;
      builder?: BuilderVariant;
      watchAssets?: boolean;
      webpack?: boolean;
      typeCheck?: boolean;
      bundleDependencies?: boolean;
      emitDeclarations?: boolean;
      silent?: boolean;
      webpackPath?: string;
      rspackPath?: string;
      tsc?: boolean;
      preserveWatchOutput?: boolean;
      all?: boolean;
      parallel?: number | true;
    };

    program
      .command('build [apps...]')
      .option(
        '-c, --config <path>',
        'Path to nest-cli configuration file.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Config path cannot be empty.');
          return val;
        },
      )
      .option('-p, --path <path>', 'Path to tsconfig file.', (val: string) => {
        if (!val.trim())
          throw new InvalidArgumentError('Path cannot be empty.');
        return val;
      })
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option(
        '-b, --builder <name>',
        `Builder to be used (choices: ${AVAILABLE_BUILDERS.join(', ')}).`,
        (val: string) => {
          const builder = val.trim().toLowerCase() as BuilderVariant;
          if (!builder)
            throw new InvalidArgumentError('Builder cannot be empty.');
          if (!AVAILABLE_BUILDERS.includes(builder))
            throw new InvalidArgumentError(
              `Allowed choices are ${AVAILABLE_BUILDERS.map((val) => `'${val}'`).join(', ')}`,
            );
          return builder;
        },
      )
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option(
        '--webpack',
        'Use webpack for compilation (deprecated option, use --builder instead).',
      )
      .option(
        '--type-check',
        'Enable type checking (when SWC or rspack is used).',
        () => true,
      )
      .option(
        '--no-type-check',
        'Disable type checking (when SWC is used).',
        () => false,
      )
      .option(
        '--bundle-dependencies',
        'Bundle node_modules into the output (when rspack is used).',
        () => true,
      )
      .option(
        '--no-bundle-dependencies',
        'Leave node_modules out of the output (when rspack is used).',
        () => false,
      )
      .option(
        '--emit-declarations',
        'Emit declaration files (.d.ts) when using SWC builder.',
      )
      .option('--silent', 'Suppress informational compiler logs.')
      .option(
        '--webpackPath <path>',
        'Path to webpack configuration.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Webpack path cannot be empty.');
          return val;
        },
      )
      .option(
        '--rspackPath <path>',
        'Path to rspack configuration.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Rspack path cannot be empty.');
          return val;
        },
      )
      .option('--tsc', 'Use typescript compiler for compilation.')
      .option(
        '--preserveWatchOutput',
        'Use "preserveWatchOutput" option when using tsc watch mode.',
      )
      .option('--all', 'Build all projects in a monorepo.')
      .option(
        '--parallel [concurrency]',
        'Build projects in parallel (with --all). Optionally limit concurrency.',
        (val: string) => {
          const normalized = val.trim();
          if (!/^\d+$/.test(normalized))
            throw new InvalidArgumentError('Expected a positive safe integer.');
          const parsed = Number(normalized);
          if (!Number.isSafeInteger(parsed) || parsed < 1)
            throw new InvalidArgumentError('Expected a positive safe integer.');
          return parsed;
        },
      )
      .description('Build Nest application.')
      .action(async (apps: string[], options: BuildCommandOptions) => {
        const isWebpackEnabled = options.tsc ? false : options.webpack;

        const context: BuildCommandContext = {
          apps: apps.length > 0 ? apps : [],
          config: options.config,
          webpack: isWebpackEnabled,
          watch: !!options.watch,
          watchAssets: !!options.watchAssets,
          path: options.path,
          webpackPath: options.webpackPath,
          rspackPath: options.rspackPath,
          builder: options.builder,
          typeCheck: options.typeCheck,
          bundleDependencies: options.bundleDependencies,
          // Left undefined when the flag is absent so `getValueOrDefault` can
          // still fall through to `compilerOptions.emitDeclarations`.
          emitDeclarations: options.emitDeclarations,
          silent: !!options.silent,
          // Left undefined when the flag is absent so `WatchCompiler` can
          // fall through to the tsconfig 'preserveWatchOutput' option.
          preserveWatchOutput:
            options.watch && !isWebpackEnabled
              ? options.preserveWatchOutput
              : false,
          all: !!options.all,
          parallel: options.parallel,
        };

        await this.action.handle(context);
      });
  }
}
