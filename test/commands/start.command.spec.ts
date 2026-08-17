import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { StartCommand } from '../../commands/start.command.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const ProcessExitError = class extends Error {
  constructor(public code: number | undefined) {
    super(`process.exit(${code})`);
  }
};

const buildProgram = (action: FakeAction) => {
  const program = new Command();
  program.exitOverride();
  new StartCommand(action).load(program);
  return program;
};

describe('StartCommand', () => {
  let action: FakeAction;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    action = new FakeAction();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new ProcessExitError(code);
    }) as never);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('--builder validation', () => {
    it('exits with code 1 when --builder receives an unknown value', async () => {
      const program = buildProgram(action);

      await expect(
        program.parseAsync(['node', 'nest', 'start', '--builder', 'foo']),
      ).rejects.toBeInstanceOf(ProcessExitError);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid builder option: foo'),
      );
      expect(action.handle).not.toHaveBeenCalled();
    });

    it.each([['tsc'], ['webpack'], ['swc'], ['rspack']])(
      'accepts %s as a valid --builder value',
      async (builder) => {
        const program = buildProgram(action);

        await program.parseAsync([
          'node',
          'nest',
          'start',
          '--builder',
          builder,
        ]);

        expect(exitSpy).not.toHaveBeenCalled();
        expect(action.handle).toHaveBeenCalledTimes(1);
        expect(action.handle).toHaveBeenCalledWith(
          expect.objectContaining({ builder }),
        );
      },
    );

    it('does not validate the builder when the option is omitted', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'start']);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(action.handle).toHaveBeenCalledTimes(1);
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
  });
});
