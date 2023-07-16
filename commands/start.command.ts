import { Command, CommanderStatic } from 'commander';
import { ERROR_PREFIX, INFO_PREFIX } from '../lib/ui';
import { getRemainingFlags } from '../lib/utils/remaining-flags';
import { AbstractCommand } from './abstract.command';
import { Input, CommandInputsContainer } from './command.input';
import type { BuilderVariant } from '../lib/configuration';

export class StartCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('start [app]')
      .option('-c, --config [path]', 'Path to nest-cli configuration file.')
      .option('-p, --path [path]', 'Path to tsconfig file.')
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option('-b, --builder [name]', 'Builder to be used (tsc, webpack, swc).')
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option(
        '-d, --debug [hostport] ',
        'Run in debug mode (with --inspect flag).',
      )
      .option(
        '--webpack',
        'Use webpack for compilation (deprecated option, use --builder instead).',
      )
      .option('--webpackPath [path]', 'Path to webpack configuration.')
      .option('--type-check', 'Enable type checking (when SWC is used).')
      .option('--tsc', 'Use tsc for compilation.')
      .option(
        '--sourceRoot [sourceRoot]',
        'Points at the root of the source code for the single project in standard mode structures, or the default project in monorepo mode structures.',
      )
      .option(
        '--entryFile [entryFile]',
        "Path to the entry file where this command will work with. Defaults to the one defined at your Nest's CLI config file.",
      )
      .option('-e, --exec [binary]', 'Binary to run (default: "node").')
      .option(
        '--preserveWatchOutput',
        'Use "preserveWatchOutput" option when tsc watch mode.',
      )
      .description('Run Nest application.')
      .action(async (app: string, command: Command) => {
        const commandOptions = new CommandInputsContainer();

        commandOptions.addInput({
          name: 'config',
          value: command.config,
        })

        const isWebpackEnabled = command.tsc ? false : command.webpack;
        commandOptions.addInput({ name: 'webpack', value: isWebpackEnabled });
        commandOptions.addInput({ name: 'debug', value: command.debug });
        commandOptions.addInput({ name: 'watch', value: !!command.watch });
        commandOptions.addInput({ name: 'watchAssets', value: !!command.watchAssets });
        commandOptions.addInput({
          name: 'path',
          value: command.path,
        });
        commandOptions.addInput({
          name: 'webpackPath',
          value: command.webpackPath,
        });
        commandOptions.addInput({
          name: 'exec',
          value: command.exec,
        });
        commandOptions.addInput({
          name: 'sourceRoot',
          value: command.sourceRoot,
        });
        commandOptions.addInput({
          name: 'entryFile',
          value: command.entryFile,
        });
        commandOptions.addInput({
          name: 'preserveWatchOutput',
          value:
            !!command.preserveWatchOutput &&
            !!command.watch &&
            !isWebpackEnabled,
        });

        const availableBuilders: BuilderVariant[] = ['tsc', 'webpack', 'swc'];
        if (command.builder && !availableBuilders.includes(command.builder)) {
          console.error(
            ERROR_PREFIX +
              ` Invalid builder option: ${
                command.builder
              }. Available builders: ${availableBuilders.join(', ')}`,
          );
          return;
        }
        commandOptions.addInput({
          name: 'builder',
          value: command.builder,
        });

        if (command.typeCheck && command.builder !== 'swc') {
          console.warn(
            INFO_PREFIX +
              ` "typeCheck" will not have any effect when "builder" is not "swc".`,
          );
        }
        commandOptions.addInput({
          name: 'typeCheck',
          value: command.typeCheck,
        });

        const inputs: Input[] = [];
        inputs.push({ name: 'app', value: app });
        const flags = getRemainingFlags(program);

        try {
          await this.action.handle(inputs, commandOptions, flags);
        } catch (err) {
          process.exit(1);
        }
      });
  }
}
