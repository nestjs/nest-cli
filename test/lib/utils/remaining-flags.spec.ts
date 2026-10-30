import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { getRemainingFlags } from '../../../lib/utils/remaining-flags.js';

function createCommand(
  rawArgs: string[],
  options: { short?: string; long?: string }[] = [],
  optionValues: Record<string, string> = {},
): Command {
  const cmd = {
    rawArgs: [...rawArgs],
    options: options.map((o) => ({
      short: o.short,
      long: o.long,
    })),
    getOptionValue: (key: string) => optionValues[key],
  } as unknown as Command;
  return cmd;
}

describe('getRemainingFlags', () => {
  it('should return flags not consumed by commander', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--watch', '--custom-flag'],
      [{ long: '--watch' }],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toContain('--custom-flag');
    expect(result).not.toContain('--watch');
  });

  it('should return empty array when all flags are consumed by commander', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--watch'],
      [{ long: '--watch' }],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toEqual([]);
  });

  it('should return an empty array when no flags starting with "--" are present', () => {
    // When no "--" flags exist, findIndex returns -1, which means no flags are present.
    // terminate early when no flags are found
    const cmd = createCommand(['node', 'nest', 'start'], []);

    const result = getRemainingFlags(cmd);

    expect(result).toEqual([]);
  });

  it('should never forward the argv preamble as extra flags', () => {
    const cmd = createCommand([
      '/usr/local/bin/node',
      '/home/u/broken-dir-no-broken/node_modules/.bin/nest',
      'add',
      '@nestjs/config',
    ]);

    const result = getRemainingFlags(cmd);

    expect(result).toEqual([]);
  });

  it('should not crash when flags containing -no- exist', () => {
    const cmd = createCommand([
      'node',
      'nest',
      'start',
      '--watch',
      '-no-',
      'value',
    ]);

    const result = getRemainingFlags(cmd);

    expect(result).toEqual(['--watch', '-no-', 'value']);
  });

  it('should filter out short option flags consumed by commander', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '-w', '--custom'],
      [{ short: '-w' }],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toContain('--custom');
    expect(result).not.toContain('-w');
  });

  it('should filter out option arguments when they match commander option values', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--config', 'tsconfig.app.json', '--custom'],
      [{ long: '--config' }],
      { config: 'tsconfig.app.json' },
    );

    const result = getRemainingFlags(cmd);

    expect(result).not.toContain('--config');
    expect(result).not.toContain('tsconfig.app.json');
    expect(result).toContain('--custom');
  });

  it('should handle multiple remaining flags', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--flag1', '--flag2', '--flag3'],
      [],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toContain('--flag1');
    expect(result).toContain('--flag2');
    expect(result).toContain('--flag3');
  });

  it('should return empty array when rawArgs is empty', () => {
    const cmd = createCommand([], []);

    const result = getRemainingFlags(cmd);

    expect(result).toEqual([]);
  });

  describe('with a subcommand', () => {
    const parse = (argv: string[]) => {
      let remaining: string[] = [];
      const program = new Command();
      // Registered first, like in `CommandLoader`, so that its short flags
      // would win if options of other subcommands were consulted.
      program
        .command('new [name]')
        .option('-d, --dry-run')
        .option('-p, --package-manager [packageManager]')
        .option('-c, --collection [collectionName]')
        .option('--strict')
        .action(() => {});
      program
        .command('add <library>')
        .allowUnknownOption()
        .allowExcessArguments()
        .option('-d, --dry-run')
        .option('-s, --skip-install')
        .option('-p, --project [project]')
        .action((_library, _options, command: Command) => {
          remaining = getRemainingFlags(command);
        });
      program
        .command('start [app]')
        .allowUnknownOption()
        .allowExcessArguments()
        .option('-c, --config [path]')
        .option('-p, --path [path]')
        .option('-d, --debug [hostport]')
        .option(
          '--env-file [path]',
          '',
          (v, prev: string[]) => [...prev, v],
          [],
        )
        .action((_app, _options, command: Command) => {
          remaining = getRemainingFlags(command);
        });

      program.parse(['node', 'nest', ...argv]);
      return remaining;
    };

    it('should filter out options and values registered on the subcommand', () => {
      expect(
        parse([
          'add',
          '@nestjs/swagger',
          '--skip-install',
          '-p',
          'api',
          '--custom-flag',
          'custom-val',
        ]),
      ).toEqual(['--custom-flag', 'custom-val']);
    });

    it('should resolve short flags against the running subcommand only', () => {
      expect(
        parse([
          'start',
          '--custom-flag',
          '-p',
          'tsconfig.build.json',
          '-c',
          'nest-cli.json',
          '-d',
          '0.0.0.0:9229',
        ]),
      ).toEqual(['--custom-flag']);
    });

    it('should keep flags that only other subcommands define', () => {
      expect(parse(['start', '--strict', '--dry-run'])).toEqual([
        '--strict',
        '--dry-run',
      ]);
    });

    it('should filter out inline and repeated option values', () => {
      expect(
        parse([
          'start',
          '--config=nest-cli.json',
          '--env-file',
          '.env.a',
          '--env-file',
          '.env.b',
          '--custom-flag',
        ]),
      ).toEqual(['--custom-flag']);
    });
  });
});
