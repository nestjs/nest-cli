import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { NewCommand } from '../../commands/new.command.js';
import { Collection } from '../../lib/schematics/index.js';
import {
  disablePrompts,
  isInteractive,
} from '../../lib/utils/is-interactive.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const buildProgram = (action: FakeAction) => {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr: () => {} });
  new NewCommand(action).load(program);
  return program;
};

const expectCommandError = async (
  action: FakeAction,
  args: string[],
  code: 'commander.optionMissingArgument' | 'commander.invalidArgument',
  message: string,
): Promise<void> => {
  const commandErrors: string[] = [];
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr: (output) => commandErrors.push(output) });
  new NewCommand(action).load(program);
  await expect(
    program.parseAsync(['node', 'nest', 'new', ...args]),
  ).rejects.toMatchObject({
    code,
    exitCode: 1,
  });

  expect(commandErrors.join('')).toContain(message);
  expect(action.handle).not.toHaveBeenCalled();
};

describe('NewCommand', () => {
  let action: FakeAction;

  beforeEach(() => {
    action = new FakeAction();
  });

  afterEach(() => {
    disablePrompts(false);
    vi.restoreAllMocks();
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
      ['TYPESCRIPT', 'ts'],
      ['JavaScript', 'js'],
      [' JS ', 'js'],
    ])('normalizes --language %s to %s', async (input, expected) => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--language', input]);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ language: expected }),
      );
    });

    it('throws an Error when --language receives an invalid value', async () => {
      await expectCommandError(
        action,
        ['--language', 'ruby'],
        'commander.invalidArgument',
        'Allowed choices are',
      );
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
          strict: true,
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
        '--type',
        'cjs',
        '--skills',
        'all',
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
        minimal: false,
        type: 'cjs',
        skills: ['all'],
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

  describe('--observe / --no-observe', () => {
    // `undefined` is meaningful here: it is what tells the action that the
    // user has not decided yet and should be prompted.
    it('leaves observe undefined when neither flag is given', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ observe: undefined }),
      );
    });

    it('passes observe: true for --observe', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--observe']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ observe: true }),
      );
    });

    it('passes observe: false for --no-observe', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--no-observe']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ observe: false }),
      );
    });
  });

  describe('--minimal', () => {
    it('defaults to false', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ minimal: false }),
      );
    });

    it('passes minimal: true', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--minimal']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ minimal: true }),
      );
    });

    it.each(['js', 'javascript', 'JS'])(
      'refuses --language %s, saying what to do',
      async (language) => {
        const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
          throw new Error('exited');
        }) as never);
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const program = buildProgram(action);

        await expect(
          program.parseAsync([
            'node',
            'nest',
            'new',
            '--minimal',
            '--language',
            language,
          ]),
        ).rejects.toThrow('exited');

        expect(exit).toHaveBeenCalledWith(1);
        expect(error.mock.calls[0][0]).toContain('TypeScript only');
        expect(action.handle).not.toHaveBeenCalled();
        exit.mockRestore();
        error.mockRestore();
      },
    );

    it('refuses --type cjs, saying what to do', async () => {
      const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('exited');
      }) as never);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const program = buildProgram(action);

      await expect(
        program.parseAsync([
          'node',
          'nest',
          'new',
          '--minimal',
          '--type',
          'cjs',
        ]),
      ).rejects.toThrow('exited');

      expect(exit).toHaveBeenCalledWith(1);
      expect(error.mock.calls[0][0]).toContain('ESM only');
      expect(action.handle).not.toHaveBeenCalled();
      exit.mockRestore();
      error.mockRestore();
    });
  });

  describe('--type', () => {
    it('leaves the module system to the schematic when omitted', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'esm' }),
      );
    });

    it.each([
      ['esm', 'esm'],
      ['cjs', 'cjs'],
      ['CJS', 'cjs'],
      ['ESM', 'esm'],
      [' ESM ', 'esm'],
    ])('passes --type %s as %s', async (value, type) => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--type', value]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ type }),
      );
    });

    it('refuses another value, naming the valid ones', async () => {
      await expectCommandError(
        action,
        ['--type', 'commonjs'],
        'commander.invalidArgument',
        'Allowed choices are',
      );
    });
  });

  describe('--no-interactive', () => {
    afterEach(() => disablePrompts(false));

    it('turns every prompt off', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new', '--no-interactive']);

      expect(isInteractive()).toBe(false);
      expect(action.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('agent skills', () => {
    const parsedSkills = async (...args: string[]) => {
      const program = buildProgram(action);
      await program.parseAsync(['node', 'nest', 'new', ...args]);
      return action.handle.mock.calls[0][0].skills;
    };

    it('leaves skills undefined without a flag, so the action asks', async () => {
      expect(await parsedSkills()).toBeUndefined();
    });

    it.each([
      [['--skills', 'all'], ['all']],
      [['--skills', 'claude'], ['claude']],
      [
        ['--skills', 'claude,agents'],
        ['claude', 'agents'],
      ],
      [
        ['--skills', 'Claude, claude ,cursor'],
        ['claude', 'cursor'],
      ],
      [['--skills', 'none'], []],
      [['--skip-skills'], []],
      [['--skills', 'all', '--skip-skills'], []],
    ])('reads %j as %j', async (args, expected) => {
      expect(await parsedSkills(...args)).toEqual(expected);
    });

    it('throws on a target the installer does not know', async () => {
      await expectCommandError(
        action,
        ['--skills', 'claude,vim'],
        'commander.invalidArgument',
        'Allowed choices are',
      );
    });
  });

  describe('--package-manager', () => {
    it.each([
      ['npm', 'npm'],
      ['pnpm', 'pnpm'],
      ['yarn', 'yarn'],
      ['bun', 'bun'],
      ['PNPM', 'pnpm'],
      [' YARN ', 'yarn'],
    ])('normalizes "%s" to "%s"', async (input, expected) => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'new',
        '--package-manager',
        input,
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ packageManager: expected }),
      );
    });

    it.each(['deno', 'ruby', 'invalid'])(
      'rejects an unsupported package manager: "%s"',
      async (value) => {
        await expectCommandError(
          action,
          ['--package-manager', value],
          'commander.invalidArgument',
          'Allowed choices are',
        );
      },
    );
  });

  describe('--directory', () => {
    it('forwards the supplied directory', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'new',
        '--directory',
        'apps/My-App',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: 'apps/My-App',
        }),
      );
    });
  });

  describe('--collection', () => {
    it('forwards a custom schematic collection', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'new',
        '--collection',
        '@any/custom-schematics',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: '@any/custom-schematics',
        }),
      );
    });

    it('uses the NestJS collection by default', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'new']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: Collection.NESTJS,
        }),
      );
    });
  });

  describe('required option arguments', () => {
    it.each([
      {
        option: '--directory',
        expectedMessage: "option '--directory <directory>' argument missing",
      },
      {
        option: '--package-manager',
        expectedMessage:
          "option '-p, --package-manager <packageManager>' argument missing",
      },
      {
        option: '--language',
        expectedMessage: "option '-l, --language <language>' argument missing",
      },
      {
        option: '--collection',
        expectedMessage:
          "option '-c, --collection <collectionName>' argument missing",
      },
      {
        option: '--type',
        expectedMessage: "option '--type <type>' argument missing",
      },
      {
        option: '--skills',
        expectedMessage: "option '--skills <agents>' argument missing",
      },
    ])(
      'rejects $option when its value is missing',
      async ({ option, expectedMessage }) => {
        await expectCommandError(
          action,
          [option],
          'commander.optionMissingArgument',
          expectedMessage,
        );
      },
    );
  });

  describe('short option aliases', () => {
    it('accepts short aliases for package manager, language and collection', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'new',
        '-p',
        'PNPM',
        '-l',
        'JS',
        '-c',
        '@any/schematics',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          packageManager: 'pnpm',
          language: 'js',
          collection: '@any/schematics',
        }),
      );
    });
  });

  describe.each([
    {
      option: '--directory',
      expectedMessage: 'Directory cannot be empty.',
    },
    {
      option: '--collection',
      expectedMessage: 'Collection cannot be empty.',
    },
    {
      option: '--package-manager',
      expectedMessage: 'Package Manager cannot be empty',
    },
    {
      option: '--language',
      expectedMessage: 'Language cannot be empty',
    },
    {
      option: '--type',
      expectedMessage: 'Module type cannot be empty',
    },
    {
      option: '--skills',
      expectedMessage: 'Agent Skills cannot be empty',
    },
  ])('$option validation', ({ option, expectedMessage }) => {
    it.each(['', ' ', '\t', '\n', ' \t\n '])(
      'rejects an empty or whitespace-only value: %j',
      async (value) => {
        await expectCommandError(
          action,
          [option, value],
          'commander.invalidArgument',
          expectedMessage,
        );
      },
    );
  });
});
