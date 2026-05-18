import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { AddCommand } from '../../commands/add.command.js';

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

  it('forwards the library positional argument to the action context', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'add', '@nestjs/swagger']);

    expect(exitSpy).not.toHaveBeenCalled();
    expect(action.handle).toHaveBeenCalledTimes(1);
    expect(action.handle).toHaveBeenCalledWith(
      expect.objectContaining({ library: '@nestjs/swagger' }),
    );
  });

  it('uses sensible defaults when only the library argument is given', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'add', '@nestjs/swagger']);

    expect(action.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        library: '@nestjs/swagger',
        dryRun: false,
        skipInstall: false,
        project: undefined,
      }),
    );
  });

  it('forwards every documented flag through to the action context', async () => {
    const program = buildProgram(action);

    await program.parseAsync([
      'node',
      'nest',
      'add',
      '@nestjs/swagger',
      '--dry-run',
      '--skip-install',
      '--project',
      'apps/api',
    ]);

    expect(action.handle).toHaveBeenCalledTimes(1);
    expect(action.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        library: '@nestjs/swagger',
        dryRun: true,
        skipInstall: true,
        project: 'apps/api',
      }),
    );
  });

  it('always supplies extraFlags (sourced from getRemainingFlags) on the context', async () => {
    const program = buildProgram(action);

    await program.parseAsync(['node', 'nest', 'add', '@nestjs/swagger']);

    const context = (action.handle as any).mock.calls[0][0];
    expect(context).toHaveProperty('extraFlags');
  });

  it('honors the short -d / -s / -p aliases for documented flags', async () => {
    const program = buildProgram(action);

    await program.parseAsync([
      'node',
      'nest',
      'add',
      '@nestjs/swagger',
      '-d',
      '-s',
      '-p',
      'apps/api',
    ]);

    expect(action.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: true,
        skipInstall: true,
        project: 'apps/api',
      }),
    );
  });

  it('exits with code 1 when the action throws', async () => {
    action.handle.mockRejectedValueOnce(new Error('boom'));
    const program = buildProgram(action);

    await expect(
      program.parseAsync(['node', 'nest', 'add', '@nestjs/swagger']),
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
