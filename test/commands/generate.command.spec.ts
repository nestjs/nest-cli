import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/utils/load-configuration.js', () => ({
  loadConfiguration: vi.fn().mockResolvedValue({
    collection: '@nestjs/schematics',
  }),
}));

vi.mock('../../lib/schematics/index.js', async () => {
  const original = await vi.importActual('../../lib/schematics/index.js');
  return {
    ...original,
    CollectionFactory: {
      create: () => ({
        getSchematics: () => [
          { name: 'controller', alias: 'co', description: 'A controller' },
        ],
      }),
    },
  };
});

import { AbstractAction } from '../../actions/abstract.action.js';
import { GenerateCommand } from '../../commands/generate.command.js';
import { GenerateCommandContext } from '../../commands/context/generate.context.js';
import {
  disablePrompts,
  isInteractive,
} from '../../lib/utils/is-interactive.js';
import { loadConfiguration } from '../../lib/utils/load-configuration.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const buildProgram = async (
  action: FakeAction,
  writeErr: (output: string) => void = () => {},
) => {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr });
  await new GenerateCommand(action).load(program);
  return program;
};

describe('GenerateCommand', () => {
  let action: FakeAction;

  const run = async (...args: string[]): Promise<GenerateCommandContext> => {
    const program = await buildProgram(action);
    await program.parseAsync(['node', 'nest', ...args]);
    expect(action.handle).toHaveBeenCalledTimes(1);
    return action.handle.mock.calls[0][0];
  };

  const expectCommandError = async (
    args: string[],
    code: 'commander.optionMissingArgument' | 'commander.invalidArgument',
    message?: string,
  ) => {
    const commandErrors: string[] = [];
    const program = await buildProgram(action, (output) =>
      commandErrors.push(output),
    );

    await expect(
      program.parseAsync(['node', 'nest', 'generate', ...args]),
    ).rejects.toMatchObject({
      code,
      exitCode: 1,
    });

    if (message) expect(commandErrors.join('')).toContain(message);
    expect(action.handle).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    action = new FakeAction();
  });

  describe('positional arguments', () => {
    it('forwards the schematic, name and path', async () => {
      const context = await run(
        'generate',
        'controller',
        'users',
        'src/modules',
      );

      expect(context.schematic).toBe('controller');
      expect(context.name).toBe('users');
      expect(context.path).toBe('src/modules');
    });

    it('leaves name and path undefined when omitted', async () => {
      const context = await run('generate', 'controller');

      expect(context.schematic).toBe('controller');
      expect(context.name).toBeUndefined();
      expect(context.path).toBeUndefined();
    });

    it('is reachable through the "g" alias', async () => {
      const context = await run('g', 'service', 'users');

      expect(context.schematic).toBe('service');
      expect(context.name).toBe('users');
    });
  });

  describe('--crud', () => {
    // `--crud [value]` takes an optional value, so commander hands back a
    // string whenever one is supplied. Both forms have to survive the mapping
    // or an explicit choice silently falls back to the schematic default.
    it('is true for the bare flag', async () => {
      const context = await run('generate', 'resource', 'users', '--crud');

      expect(context.crud).toBe(true);
    });

    it('is true for the string "true"', async () => {
      const context = await run(
        'generate',
        'resource',
        'users',
        '--crud',
        'true',
      );

      expect(context.crud).toBe(true);
    });

    it('is false for the string "false"', async () => {
      const context = await run(
        'generate',
        'resource',
        'users',
        '--crud',
        'false',
      );

      expect(context.crud).toBe(false);
    });

    it('is false for the inline "--crud=false" form', async () => {
      const context = await run(
        'generate',
        'resource',
        'users',
        '--crud=false',
      );

      expect(context.crud).toBe(false);
    });

    it('is undefined when the flag is omitted', async () => {
      const context = await run('generate', 'resource', 'users');

      expect(context.crud).toBeUndefined();
    });

    it('is false for --no-crud', async () => {
      const context = await run('generate', 'resource', 'users', '--no-crud');

      expect(context.crud).toBe(false);
    });

    it.each(['TRUE', 'FALSE', 'yes', 'no', '1', '0', 'invalid'])(
      'rejects the invalid value "%s"',
      async (value) => {
        await expectCommandError(
          ['resource', 'users', '--crud', value],
          'commander.invalidArgument',
          'CRUD value must be either "true" or "false".',
        );
      },
    );

    it.each(['', '   '])(
      'rejects an empty or whitespace-only value ("%s")',
      async (value) => {
        await expectCommandError(
          ['resource', 'users', '--crud', value],
          'commander.invalidArgument',
          'CRUD value must be either "true" or "false".',
        );
      },
    );
  });

  describe('--flat / --no-flat', () => {
    it('is true for --flat', async () => {
      const context = await run('generate', 'controller', 'users', '--flat');

      expect(context.flat).toBe(true);
    });

    it('is false for --no-flat', async () => {
      const context = await run('generate', 'controller', 'users', '--no-flat');

      expect(context.flat).toBe(false);
    });

    it('is undefined when neither flag is passed, so config can decide', async () => {
      const context = await run('generate', 'controller', 'users');

      expect(context.flat).toBeUndefined();
    });
  });

  describe('--spec / --no-spec', () => {
    // The action distinguishes "user asked for this" from "this is the
    // default" so nest-cli.json generateOptions can win when the user stayed
    // silent — hence the {value, passedAsInput} shape rather than a boolean.
    it('defaults to spec enabled, not passed as input', async () => {
      const context = await run('generate', 'controller', 'users');

      expect(context.spec).toEqual({ value: true, passedAsInput: false });
    });

    it('marks --spec as passed as input', async () => {
      const context = await run('generate', 'controller', 'users', '--spec');

      expect(context.spec).toEqual({ value: true, passedAsInput: true });
    });

    it('marks --no-spec as passed as input with value false', async () => {
      const context = await run('generate', 'controller', 'users', '--no-spec');

      expect(context.spec).toEqual({ value: false, passedAsInput: true });
    });
  });

  describe('remaining options', () => {
    it('defaults dryRun to false and sets it for -d', async () => {
      expect((await run('generate', 'controller', 'users')).dryRun).toBe(false);

      action = new FakeAction();
      expect((await run('generate', 'controller', 'users', '-d')).dryRun).toBe(
        true,
      );
    });

    it('defaults skipImport to false and sets it for --skip-import', async () => {
      expect((await run('generate', 'controller', 'users')).skipImport).toBe(
        false,
      );

      action = new FakeAction();
      expect(
        (await run('generate', 'controller', 'users', '--skip-import'))
          .skipImport,
      ).toBe(true);
    });

    it('defaults format to false and sets it for --format', async () => {
      expect((await run('generate', 'controller', 'users')).format).toBe(false);

      action = new FakeAction();
      expect(
        (await run('generate', 'controller', 'users', '--format')).format,
      ).toBe(true);
    });

    describe('--type', () => {
      it('forwards the supplied value', async () => {
        const context = await run(
          'generate',
          'resource',
          'users',
          '--type',
          'graphql',
        );

        expect(context.type).toBe('graphql');
      });

      it('requires a value', async () => {
        await expectCommandError(
          ['resource', 'users', '--type'],
          'commander.optionMissingArgument',
        );
      });

      it.each(['', '   '])(
        'rejects an empty or whitespace-only value ("%s")',
        async (value) => {
          await expectCommandError(
            ['resource', 'users', '--type', value],
            'commander.invalidArgument',
            'Type cannot be empty.',
          );
        },
      );

      it('preserves the original value when it contains surrounding whitespace', async () => {
        const context = await run(
          'generate',
          'resource',
          'users',
          '--type',
          ' graphql ',
        );

        expect(context.type).toBe(' graphql ');
      });
    });

    describe('--project', () => {
      it('forwards the supplied value', async () => {
        const context = await run(
          'generate',
          'controller',
          'users',
          '--project',
          'api',
        );

        expect(context.project).toBe('api');
      });

      it('requires a value', async () => {
        await expectCommandError(
          ['controller', 'users', '--project'],
          'commander.optionMissingArgument',
        );
      });

      it.each(['', '   '])(
        'rejects an empty or whitespace-only value ("%s")',
        async (value) => {
          await expectCommandError(
            ['controller', 'users', '--project', value],
            'commander.invalidArgument',
            'Project cannot be empty.',
          );
        },
      );

      it('preserves the original value when it contains surrounding whitespace', async () => {
        const context = await run(
          'generate',
          'controller',
          'users',
          '--project',
          ' api ',
        );

        expect(context.project).toBe(' api ');
      });
    });

    describe('--collection', () => {
      it('forwards the supplied value', async () => {
        const context = await run(
          'generate',
          'controller',
          'users',
          '--collection',
          '@my/schematics',
        );

        expect(context.collection).toBe('@my/schematics');
      });

      it('requires a value', async () => {
        await expectCommandError(
          ['controller', 'users', '--collection'],
          'commander.optionMissingArgument',
        );
      });

      it.each(['', '   '])(
        'rejects an empty or whitespace-only value ("%s")',
        async (value) => {
          await expectCommandError(
            ['controller', 'users', '--collection', value],
            'commander.invalidArgument',
            'Collection cannot be empty.',
          );
        },
      );

      it('preserves the original value when it contains surrounding whitespace', async () => {
        const context = await run(
          'generate',
          'controller',
          'users',
          '--collection',
          ' @my/schematics ',
        );

        expect(context.collection).toBe(' @my/schematics ');
      });
    });

    describe('--prefix', () => {
      it('forwards the supplied value', async () => {
        const context = await run(
          'generate',
          'library',
          'shared',
          '--prefix',
          '@acme',
        );

        expect(context.prefix).toBe('@acme');
      });

      it('requires a value', async () => {
        await expectCommandError(
          ['library', 'shared', '--prefix'],
          'commander.optionMissingArgument',
        );
      });

      it.each(['', '   '])(
        'rejects an empty or whitespace-only value ("%s")',
        async (value) => {
          await expectCommandError(
            ['library', 'shared', '--prefix', value],
            'commander.invalidArgument',
            'Prefix cannot be empty.',
          );
        },
      );

      it('preserves the original value when it contains surrounding whitespace', async () => {
        const context = await run(
          'generate',
          'library',
          'shared',
          '--prefix',
          ' @acme ',
        );

        expect(context.prefix).toBe(' @acme ');
      });
    });

    it('turns every prompt off with --no-interactive', async () => {
      try {
        await run('generate', 'resource', 'users', '--no-interactive');

        expect(isInteractive()).toBe(false);
      } finally {
        disablePrompts(false);
      }
    });

    describe('--spec-file-suffix', () => {
      it('forwards the supplied value', async () => {
        const context = await run(
          'generate',
          'controller',
          'users',
          '--spec-file-suffix',
          'test',
        );

        expect(context.specFileSuffix).toBe('test');
      });

      it('requires a value', async () => {
        await expectCommandError(
          ['generate', 'controller', 'users', '--spec-file-suffix'],
          'commander.optionMissingArgument',
        );
      });

      it.each(['', '   '])(
        'rejects an empty or whitespace-only value ("%s")',
        async (value) => {
          await expectCommandError(
            ['generate', 'controller', 'users', '--spec-file-suffix', value],
            'commander.invalidArgument',
            'Spec file suffix cannot be empty.',
          );
        },
      );

      it('preserves the original value when it contains surrounding whitespace', async () => {
        const context = await run(
          'generate',
          'controller',
          'users',
          '--spec-file-suffix',
          ' test ',
        );

        expect(context.specFileSuffix).toBe(' test ');
      });
    });
  });

  describe('description', () => {
    const argv = process.argv;
    const describeWith = async (...args: string[]) => {
      process.argv = ['node', 'nest', ...args];
      const program = await buildProgram(action);
      return program.commands[0].description();
    };

    afterEach(() => {
      process.argv = argv;
    });

    it.each([[], ['--help'], ['g', '-h'], ['g', '-dh'], ['help', 'g']])(
      'lists the schematics when help is printed (%j)',
      async (...args: string[]) => {
        const description = await describeWith(...args);

        expect(description).toContain('controller');
      },
    );

    it('skips the schematics when a command runs', async () => {
      vi.mocked(loadConfiguration).mockClear();
      const description = await describeWith('g', 'controller', 'users');

      expect(description).toBe('Generate a Nest element.');
      expect(loadConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('failures', () => {
    it('exits with code 1 when the action throws', async () => {
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as never);
      action.handle.mockRejectedValueOnce(new Error('boom'));

      const program = await buildProgram(action);
      await program.parseAsync(['node', 'nest', 'generate', 'foo', 'bar']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });
});
