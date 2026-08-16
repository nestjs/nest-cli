import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { DeployCommand } from '../../commands/deploy.command.js';
import { DeployCommandContext } from '../../commands/context/index.js';

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
  new DeployCommand(action).load(program);
  return program;
};

describe('DeployCommand', () => {
  let action: FakeAction;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const run = async (...args: string[]): Promise<DeployCommandContext> => {
    const program = buildProgram(action);
    await program.parseAsync(['node', 'nest', ...args]);
    expect(action.handle).toHaveBeenCalledTimes(1);
    return action.handle.mock.calls[0][0];
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

  it('runs the action with no forwarded arguments by default', async () => {
    const context = await run('deploy');

    expect(context.args).toEqual([]);
  });

  it('is registered as a "deploy" command', () => {
    const program = buildProgram(action);

    expect(program.commands.map((cmd) => cmd.name())).toContain('deploy');
  });

  describe('argument forwarding', () => {
    // Every flag belongs to `mau deploy`; the CLI deliberately claims none of
    // them so Mau can add options without the CLI needing a release.
    it('forwards unknown long flags', async () => {
      const context = await run('deploy', '--force');

      expect(context.args).toEqual(['--force']);
    });

    it('forwards flags with inline values', async () => {
      const context = await run('deploy', '--env=production');

      expect(context.args).toEqual(['--env=production']);
    });

    it('forwards flags with separate values', async () => {
      const context = await run('deploy', '--region', 'eu-central-1');

      expect(context.args).toEqual(['--region', 'eu-central-1']);
    });

    it('forwards short flags', async () => {
      const context = await run('deploy', '-y');

      expect(context.args).toEqual(['-y']);
    });

    it('forwards several arguments in the order given', async () => {
      const context = await run('deploy', '--force', '--env=prod', 'extra');

      expect(context.args).toEqual(['--force', '--env=prod', 'extra']);
    });
  });

  it('exits with code 1 when the action rejects', async () => {
    action.handle.mockRejectedValueOnce(new Error('deploy failed'));
    const program = buildProgram(action);

    await expect(
      program.parseAsync(['node', 'nest', 'deploy']),
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
