import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { BuildCommand } from '../../commands/build.command.js';

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
  new BuildCommand(action).load(program);
  return program;
};

describe('BuildCommand', () => {
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
        program.parseAsync(['node', 'nest', 'build', '--builder', 'foo']),
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
          'build',
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

      await program.parseAsync(['node', 'nest', 'build']);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(action.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('--parallel validation', () => {
    it('exits with code 1 when --parallel receives a non-positive integer', async () => {
      const program = buildProgram(action);

      await expect(
        program.parseAsync(['node', 'nest', 'build', '--parallel', '0']),
      ).rejects.toBeInstanceOf(ProcessExitError);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid --parallel value'),
      );
      expect(action.handle).not.toHaveBeenCalled();
    });

    it('exits with code 1 when --parallel receives a non-numeric string', async () => {
      const program = buildProgram(action);

      await expect(
        program.parseAsync(['node', 'nest', 'build', '--parallel', 'abc']),
      ).rejects.toBeInstanceOf(ProcessExitError);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(action.handle).not.toHaveBeenCalled();
    });

    it('forwards a positive integer to the action context', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build', '--parallel', '4']);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ parallel: 4 }),
      );
    });
  });
});
