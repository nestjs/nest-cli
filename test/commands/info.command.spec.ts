import { Command, CommanderError } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  beforeEach(() => {
    action = new FakeAction();
  });

  it('invokes the action when called without extra args', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'info']);

    expect(action.handle).toHaveBeenCalledTimes(1);
    expect(action.handle).toHaveBeenCalledWith();
  });

  it('responds to the "i" alias', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'i']);

    expect(action.handle).toHaveBeenCalledTimes(1);
    expect(action.handle).toHaveBeenCalledWith();
  });

  it('exposes the expected description on the registered command', () => {
    const program = buildProgram(action);

    const info = program.commands.find((cmd) => cmd.name() === 'info');

    expect(info).toBeDefined();
    expect(info!.description()).toBe('Display Nest project details.');
  });

  it('rejects extra positional arguments via commander', async () => {
    const program = buildProgram(action);

    await expect(
      program.parseAsync(['node', 'nest', 'info', 'unexpected']),
    ).rejects.toBeInstanceOf(CommanderError);

    expect(action.handle).not.toHaveBeenCalled();
  });
});
