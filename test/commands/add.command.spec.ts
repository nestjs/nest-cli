import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { AddCommand } from '../../commands/add.command.js';
import { AddCommandContext } from '../../commands/context/index.js';

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
  new AddCommand(action).load(program);
  return program;
};

describe('AddCommand', () => {
  let action: FakeAction;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const run = async (...args: string[]): Promise<AddCommandContext> => {
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

  it('forwards the library name', async () => {
    const context = await run('add', '@nestjs/swagger');

    expect(context.library).toBe('@nestjs/swagger');
  });

  it('defaults dryRun to false and sets it for --dry-run', async () => {
    expect((await run('add', '@nestjs/swagger')).dryRun).toBe(false);

    action = new FakeAction();
    expect((await run('add', '@nestjs/swagger', '--dry-run')).dryRun).toBe(
      true,
    );
  });

  it('defaults skipInstall to false and sets it for --skip-install', async () => {
    expect((await run('add', '@nestjs/swagger')).skipInstall).toBe(false);

    action = new FakeAction();
    expect(
      (await run('add', '@nestjs/swagger', '--skip-install')).skipInstall,
    ).toBe(true);
  });

  it('forwards --project', async () => {
    const context = await run('add', '@nestjs/swagger', '--project', 'api');

    expect(context.project).toBe('api');
  });

  it('collects library-specific unknown flags as extra flags', async () => {
    // `allowUnknownOption` lets library-specific flags through so they can be
    // forwarded to the library's own schematic rather than being rejected.
    const context = await run('add', '@nestjs/swagger', '--custom-lib-flag');

    expect(context.extraFlags).toContain('--custom-lib-flag');
  });

  it('exits with code 1 when the action rejects', async () => {
    action.handle.mockRejectedValueOnce(new Error('install failed'));
    const program = buildProgram(action);

    await expect(
      program.parseAsync(['node', 'nest', 'add', '@nestjs/swagger']),
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
