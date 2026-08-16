import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { InfoCommand } from '../../commands/info.command.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const buildProgram = (action: FakeAction) => {
  const program = new Command();
  program.exitOverride();
  new InfoCommand(action).load(program);
  return program;
};

describe('InfoCommand', () => {
  let action: FakeAction;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    action = new FakeAction();
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('runs the action when invoked without arguments', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'info']);

    expect(action.handle).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('is reachable through the "i" alias', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'i']);

    expect(action.handle).toHaveBeenCalledTimes(1);
  });

  it('rejects unexpected positional arguments rather than ignoring them', async () => {
    const program = buildProgram(action);

    await expect(
      program.parseAsync(['node', 'nest', 'info', 'unexpected']),
    ).rejects.toThrow(/too many arguments/i);

    expect(action.handle).not.toHaveBeenCalled();
  });
});
