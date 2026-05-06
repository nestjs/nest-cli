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
});
