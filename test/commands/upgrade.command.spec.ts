import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { UpgradeCommandContext } from '../../commands/context/index.js';
import { UpgradeCommand } from '../../commands/upgrade.command.js';

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
  new UpgradeCommand(action).load(program);
  return program;
};

describe('UpgradeCommand', () => {
  let action: FakeAction;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const run = async (...args: string[]): Promise<UpgradeCommandContext> => {
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

  describe('registration', () => {
    it('is registered as "upgrade" with the "update" alias', () => {
      const program = buildProgram(action);
      const command = program.commands.find((cmd) => cmd.name() === 'upgrade');

      expect(command).toBeDefined();
      expect(command!.aliases()).toContain('update');
      expect(command!.description()).toBe(
        'Upgrade your project to the latest NestJS major version.',
      );
    });

    it('declares the documented flags', () => {
      const program = buildProgram(action);
      const command = program.commands.find((cmd) => cmd.name() === 'upgrade')!;
      const flags = command.options.map((option) => option.flags);

      expect(flags).toEqual(
        expect.arrayContaining([
          '-d, --dry-run',
          '-s, --skip-install',
          '--observe',
          '--no-observe',
          '-t, --tag [tag]',
          '-c, --collection [collectionName]',
        ]),
      );
    });
  });

  it('builds a context with defaults when no flags are given', async () => {
    const context = await run('upgrade');

    expect(context).toEqual({
      dryRun: false,
      skipInstall: false,
      observe: undefined,
      tag: undefined,
      collection: undefined,
    });
  });

  it('can be invoked through the "update" alias', async () => {
    await run('update');

    expect(action.handle).toHaveBeenCalledTimes(1);
  });

  it('sets dryRun for --dry-run', async () => {
    expect((await run('upgrade', '--dry-run')).dryRun).toBe(true);
  });

  it('sets skipInstall for --skip-install', async () => {
    expect((await run('upgrade', '--skip-install')).skipInstall).toBe(true);
  });

  it('forwards --tag', async () => {
    expect((await run('upgrade', '--tag', 'next')).tag).toBe('next');
  });

  it('forwards --collection', async () => {
    expect(
      (await run('upgrade', '--collection', '@acme/schematics')).collection,
    ).toBe('@acme/schematics');
  });

  it('honors the short -d / -s / -t / -c aliases', async () => {
    const context = await run('upgrade', '-d', '-s', '-t', 'next', '-c', 'x');

    expect(context.dryRun).toBe(true);
    expect(context.skipInstall).toBe(true);
    expect(context.tag).toBe('next');
    expect(context.collection).toBe('x');
  });

  describe('--observe / --no-observe', () => {
    // The schematic has its own `x-prompt` for this option, so the CLI must
    // hand over "not specified" rather than collapsing it to false.
    it('leaves observe undefined when neither flag is given', async () => {
      expect((await run('upgrade')).observe).toBeUndefined();
    });

    it('passes observe: true for --observe', async () => {
      expect((await run('upgrade', '--observe')).observe).toBe(true);
    });

    it('passes observe: false for --no-observe', async () => {
      expect((await run('upgrade', '--no-observe')).observe).toBe(false);
    });
  });

  it('exits with code 1 when the action rejects', async () => {
    action.handle.mockRejectedValueOnce(new Error('upgrade failed'));
    const program = buildProgram(action);

    await expect(
      program.parseAsync(['node', 'nest', 'upgrade']),
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
