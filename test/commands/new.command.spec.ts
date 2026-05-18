import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { NewCommand } from '../../commands/new.command.js';
import { Collection } from '../../lib/schematics/index.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const buildProgram = (action: FakeAction) => {
  const program = new Command();
  program.exitOverride();
  new NewCommand(action).load(program);
  return program;
};

describe('NewCommand', () => {
  let action: FakeAction;

  beforeEach(() => {
    action = new FakeAction();
  });

  describe('--language normalization', () => {
    it('defaults language to "ts" when --language is omitted', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'ts' }),
      );
    });

    it.each([
      ['javascript', 'js'],
      ['typescript', 'ts'],
      ['js', 'js'],
      ['ts', 'ts'],
      ['JS', 'js'],
    ])('normalizes --language %s to %s', async (input, expected) => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--language', input]);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ language: expected }),
      );
    });

    it('throws an Error when --language receives an invalid value', async () => {
      const program = buildProgram(action);

      await expect(
        program.parseAsync(['node', 'nest', 'new', '--language', 'ruby']),
      ).rejects.toThrow(/Invalid language "ruby"/);

      expect(action.handle).not.toHaveBeenCalled();
    });
  });

  describe('positional name', () => {
    it('forwards the positional name argument as context.name', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', 'my-app']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'my-app' }),
      );
    });

    it('passes name as undefined when not provided', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ name: undefined }),
      );
    });
  });

  describe('option forwarding', () => {
    it('uses default values when no options are passed', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: undefined,
          dryRun: false,
          skipGit: false,
          skipInstall: false,
          skipTests: false,
          packageManager: undefined,
          language: 'ts',
          collection: Collection.NESTJS,
          strict: false,
          format: false,
        }),
      );
    });

    it('forwards every supported flag through to the action context', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'new',
        'my-app',
        '--directory',
        'apps/my-app',
        '--dry-run',
        '--skip-git',
        '--skip-install',
        '--skip-tests',
        '--package-manager',
        'pnpm',
        '--collection',
        '@custom/schematics',
        '--strict',
        '--format',
        '--language',
        'javascript',
      ]);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith({
        name: 'my-app',
        directory: 'apps/my-app',
        dryRun: true,
        skipGit: true,
        skipInstall: true,
        skipTests: true,
        packageManager: 'pnpm',
        language: 'js',
        collection: '@custom/schematics',
        strict: true,
        format: true,
      });
    });
  });

  describe('--format semantics', () => {
    it('passes format: false when --format is omitted', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ format: false }),
      );
    });

    it('passes format: true when --format is provided', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--format']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ format: true }),
      );
    });
  });
});
