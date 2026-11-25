import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { AddCommand } from '../../commands/add.command.js';
import type { AddCommandContext } from '../../commands/context/index.js';
import { NewCommand } from '../../commands/new.command.js';

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

  const expectCommandError = async (
    action: FakeAction,
    args: string[],
    code: 'commander.optionMissingArgument',
    message?: string,
  ): Promise<void> => {
    const commandErrors: string[] = [];
    const program = buildProgram(action, (output) =>
      commandErrors.push(output),
    );

    await expect(
      program.parseAsync(['node', 'nest', 'add', '@nestjs/swagger', ...args]),
    ).rejects.toMatchObject({
      code,
      exitCode: 1,
    });

    if (message) expect(commandErrors.join('')).toContain(message);
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

  describe('--project', () => {
    it('leaves project undefined when the flag is omitted', async () => {
      const context = await run('add', '@nestjs/swagger');

      expect(context.project).toBeUndefined();
    });

    it('forwards the project name as a string', async () => {
      const context = await run('add', '@nestjs/swagger', '--project', 'api');

      expect(typeof context.project).toBe('string');
      expect(context.project).toBe('api');
    });

    it.each(['--project', '-p'])(
      'requires an argument when %s is supplied',
      async (flag) => {
        await expectCommandError(
          action,
          [flag],
          'commander.optionMissingArgument',
          'argument missing',
        );
      },
    );
  });

  it('honors the short -d / -s / -p aliases for documented flags', async () => {
    const context = await run(
      'add',
      '@nestjs/swagger',
      '-d',
      '-s',
      '-p',
      'apps/api',
    );

    expect(context.dryRun).toBe(true);
    expect(context.skipInstall).toBe(true);
    expect(context.project).toBe('apps/api');
  });

  it('collects library-specific unknown flags as extra flags', async () => {
    // `allowUnknownOption` + `allowExcessArguments` let library-specific
    // flags through so they can be forwarded to the library's own schematic
    // rather than being rejected by commander as excess arguments.
    const context = await run(
      'add',
      '@nestjs/swagger',
      '--skip-install',
      '-p',
      'api',
      '--custom-lib-flag',
    );

    expect(context.extraFlags).toEqual(['--custom-lib-flag']);
  });

  it('matches short flags against add options when other commands are loaded', async () => {
    // `new` is loaded first by `CommandLoader` and reuses `-p` for
    // `--package-manager`.
    const program = new Command();
    program.exitOverride();
    new NewCommand(new FakeAction()).load(program);
    new AddCommand(action).load(program);

    await program.parseAsync([
      'node',
      'nest',
      'add',
      '@nestjs/swagger',
      '--skip-install',
      '-p',
      'api',
      '--strict',
    ]);

    const context = action.handle.mock.calls[0][0];
    expect(context.project).toBe('api');
    expect(context.extraFlags).toEqual(['--strict']);
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
