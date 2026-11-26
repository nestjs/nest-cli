import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { NewCommand } from '../../commands/new.command.js';
import { StartCommand } from '../../commands/start.command.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const ProcessExitError = class extends Error {
  constructor(public code: number | undefined) {
    super(`process.exit(${code})`);
  }
};

const buildProgram = (
  action: FakeAction,
  writeErr: (output: string) => void = () => {},
) => {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr });
  new StartCommand(action).load(program);
  return program;
};

describe('StartCommand', () => {
  let action: FakeAction;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const expectCommandError = async (
    action: FakeAction,
    args: string[],
    code: 'commander.optionMissingArgument' | 'commander.invalidArgument',
    message: string,
  ): Promise<void> => {
    const commandErrors: string[] = [];
    const program = buildProgram(action, (output) =>
      commandErrors.push(output),
    );

    await expect(
      program.parseAsync(['node', 'nest', 'start', ...args]),
    ).rejects.toMatchObject({
      code,
      exitCode: 1,
    });

    expect(commandErrors.join('')).toContain(message);
    expect(action.handle).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    action = new FakeAction();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new ProcessExitError(code);
    }) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe('--builder validation', () => {
    it('rejects an unknown builder value before the action runs', async () => {
      await expectCommandError(
        action,
        ['--builder', 'foo'],
        'commander.invalidArgument',
        'Allowed choices are',
      );
    });

    it('rejects an empty builder value before the action runs', async () => {
      await expectCommandError(
        action,
        ['--builder', ''],
        'commander.invalidArgument',
        'Builder cannot be empty.',
      );
    });

    it.each([
      ['tsc', 'tsc'],
      ['Webpack', 'webpack'],
      ['SWC', 'swc'],
      ['rspack', 'rspack'],
    ])(
      'accepts %s as a valid --builder value and normalizes to %s',
      async (value, expected) => {
        const program = buildProgram(action);

        await program.parseAsync(['node', 'nest', 'start', '--builder', value]);

        expect(exitSpy).not.toHaveBeenCalled();
        expect(action.handle).toHaveBeenCalledTimes(1);
        expect(action.handle).toHaveBeenCalledWith(
          expect.objectContaining({ builder: expected }),
        );
      },
    );

    it('allows starting without explicitly specifying a builder', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start']);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle.mock.calls[0][0].builder).toBeUndefined();
    });
  });

  describe('--emit-declarations', () => {
    it('leaves emitDeclarations undefined when the flag is absent', async () => {
      // A materialized `false` would win over compilerOptions.emitDeclarations
      // in getValueOrDefault and permanently shadow the nest-cli.json setting.
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ emitDeclarations: undefined }),
      );
    });

    it('forwards true when the flag is passed', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--emit-declarations',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ emitDeclarations: true }),
      );
    });
  });

  describe('--bundle-dependencies', () => {
    it.each([
      [[], undefined],
      [['--bundle-dependencies'], true],
      [['--no-bundle-dependencies'], false],
    ])('forwards %j as %s', async (flags, expected) => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start', ...flags]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ bundleDependencies: expected }),
      );
    });

    it('does not pass the flags on to the app', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--no-bundle-dependencies',
        '--custom-flag',
      ]);

      expect(action.handle.mock.calls[0][0].extraFlags).toEqual([
        '--custom-flag',
      ]);
    });
  });

  describe('pass-through of unknown flags', () => {
    // `nest start` forwards flags it does not recognise to the application,
    // which requires both allowUnknownOption (so they are not rejected) and
    // allowExcessArguments (because commander collects them into args).
    it('accepts an unknown flag and forwards it as an extra flag', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start', '--custom-flag']);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(action.handle.mock.calls[0][0].extraFlags).toContain(
        '--custom-flag',
      );
    });

    it('accepts unknown flags alongside an app name', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        'my-app',
        '--custom-flag',
        '--another',
      ]);

      expect(exitSpy).not.toHaveBeenCalled();
      const context = action.handle.mock.calls[0][0];
      expect(context.app).toBe('my-app');
      expect(context.extraFlags).toEqual(
        expect.arrayContaining(['--custom-flag', '--another']),
      );
    });

    it('excludes start command options and their values from extraFlags', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--watch',
        '--builder',
        'swc',
        '--env-file',
        '.env',
        '--custom-flag',
      ]);

      const context = action.handle.mock.calls[0][0];
      expect(context.extraFlags).toEqual(['--custom-flag']);
    });

    it('matches short flags against start options when other commands are loaded', async () => {
      // `new` is loaded first by `CommandLoader` and reuses `-p`, `-c` and
      // `-d` for other options, and defines `--strict`.
      const program = new Command();
      program.exitOverride();
      new NewCommand(new FakeAction()).load(program);
      new StartCommand(action).load(program);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--watch',
        '-p',
        'tsconfig.build.json',
        '-c',
        'nest-cli.json',
        '-d',
        '0.0.0.0:9229',
        '--strict',
      ]);

      const context = action.handle.mock.calls[0][0];
      expect(context.path).toBe('tsconfig.build.json');
      expect(context.extraFlags).toEqual(['--strict']);
    });
  });

  describe('remaining options', () => {
    it('forwards --exec, --sourceRoot and --entryFile', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--exec',
        'bun',
        '--sourceRoot',
        'apps/api/src',
        '--entryFile',
        'bootstrap',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          exec: 'bun',
          sourceRoot: 'apps/api/src',
          entryFile: 'bootstrap',
        }),
      );
    });

    it('collects repeated --env-file flags into an array', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--env-file',
        '.env',
        '--env-file',
        '.env.local',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ envFile: ['.env', '.env.local'] }),
      );
    });

    it('defaults shell to true and disables it with --no-shell', async () => {
      const program = buildProgram(action);
      await program.parseAsync(['node', 'nest', 'start']);
      expect(action.handle.mock.calls[0][0].shell).toBe(true);

      action = new FakeAction();
      const next = buildProgram(action);
      await next.parseAsync(['node', 'nest', 'start', '--no-shell']);
      expect(action.handle.mock.calls[0][0].shell).toBe(false);
    });

    it('turns off webpack when --tsc is passed', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start', '--webpack', '--tsc']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ webpack: false }),
      );
    });

    it('selects the tsc builder when --tsc is passed', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start', '--tsc']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ builder: 'tsc' }),
      );
    });
  });

  describe('--preserveWatchOutput', () => {
    it('stays undefined in tsc watch mode when the flag is absent, so the tsconfig value can apply', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start', '--watch', '--tsc']);

      expect(action.handle.mock.calls[0][0].preserveWatchOutput).toBe(
        undefined,
      );
    });

    it('forwards true when the flag is passed in tsc watch mode', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--watch',
        '--tsc',
        '--preserveWatchOutput',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ preserveWatchOutput: true }),
      );
    });

    it('forwards false outside of tsc watch mode', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'start',
        '--tsc',
        '--preserveWatchOutput',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ preserveWatchOutput: false }),
      );
    });
  });

  describe('option argument validation', () => {
    it.each([
      '--config',
      '--path',
      '--builder',
      '--webpackPath',
      '--rspackPath',
      '--sourceRoot',
      '--entryFile',
      '--exec',
      '--env-file',
    ])('requires an argument for %s', async (flag) => {
      await expectCommandError(
        action,
        [flag],
        'commander.optionMissingArgument',
        'argument missing',
      );
    });

    it.each([
      ['--config', ''],
      ['--config', ' \t\r\n'],
      ['--path', ''],
      ['--path', ' \t\r\n'],
      ['--builder', ''],
      ['--builder', ' \t\r\n'],
      ['--webpackPath', ''],
      ['--webpackPath', ' \t\r\n'],
      ['--rspackPath', ''],
      ['--rspackPath', ' \t\r\n'],
      ['--sourceRoot', ''],
      ['--sourceRoot', ' \t\r\n'],
      ['--entryFile', ''],
      ['--entryFile', ' \t\r\n'],
      ['--exec', ''],
      ['--exec', ' \t\r\n'],
      ['--env-file', ''],
      ['--env-file', ' \t\r\n'],
      ['--debug', ''],
      ['--debug', ' \t\r\n'],
    ])('rejects an empty value for %s', async (flag, value) => {
      await expectCommandError(
        action,
        [flag, value],
        'commander.invalidArgument',
        'cannot be empty.',
      );
    });

    it('keeps the --debug host/port argument optional', async () => {
      const program = buildProgram(action);
      await program.parseAsync(['node', 'nest', 'start', '--debug']);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ debug: true }),
      );
    });
  });
});
