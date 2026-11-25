import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractAction } from '../../actions/abstract.action.js';
import { BuildCommand } from '../../commands/build.command.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const buildProgram = (
  action: FakeAction,
  writeErr: (output: string) => void = () => {},
) => {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr });
  new BuildCommand(action).load(program);
  return program;
};

describe('BuildCommand', () => {
  let action: FakeAction;

  const expectCommandError = async (
    action: FakeAction,
    args: string[],
    code: 'commander.optionMissingArgument' | 'commander.invalidArgument',
    message?: string,
  ): Promise<void> => {
    const commandErrors: string[] = [];
    const program = buildProgram(action, (output) =>
      commandErrors.push(output),
    );
    await expect(
      program.parseAsync(['node', 'nest', 'build', ...args]),
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

  describe('--builder validation', () => {
    it('exits with code 1 when --builder receives an unknown value', async () => {
      await expectCommandError(
        action,
        ['--builder', 'foo'],
        'commander.invalidArgument',
        'Allowed choices are',
      );
    });

    it('exits with code 1 when --builder receives an empty string', async () => {
      await expectCommandError(
        action,
        ['--builder', ''],
        'commander.invalidArgument',
        'Builder cannot be empty.',
      );
    });

    it.each([
      ['tsc', 'tsc'],
      ['Webpack', 'webpack'],
      ['SWC', 'swc'],
      ['rspack', 'rspack'],
    ])(
      'accepts %s as a valid --builder value and normalizes to %s',
      async (builder, expected) => {
        const program = buildProgram(action);

        await program.parseAsync([
          'node',
          'nest',
          'build',
          '--builder',
          builder,
        ]);

        expect(action.handle).toHaveBeenCalledTimes(1);
        expect(action.handle).toHaveBeenCalledWith(
          expect.objectContaining({ builder: expected }),
        );
      },
    );

    it('does not validate the builder when the option is omitted', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build']);

      expect(action.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('--parallel validation', () => {
    it('exits with code 1 when --parallel receives a non-positive integer', async () => {
      await expectCommandError(
        action,
        ['--parallel', '0'],
        'commander.invalidArgument',
        'Expected a positive safe integer.',
      );
    });

    it('exits with code 1 when --parallel receives a non-numeric string', async () => {
      await expectCommandError(
        action,
        ['--parallel', '4abc'],
        'commander.invalidArgument',
        'Expected a positive safe integer.',
      );
    });

    it('passes true when --parallel is provided without a value', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build', '--parallel']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ parallel: true }),
      );
    });

    it('forwards a positive integer to the action context', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build', '--parallel', '4']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ parallel: 4 }),
      );
    });
  });

  describe('--emit-declarations', () => {
    it('leaves emitDeclarations undefined when the flag is absent', async () => {
      // A materialized `false` wins over `compilerOptions.emitDeclarations` in
      // getValueOrDefault, permanently shadowing the nest-cli.json setting.
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ emitDeclarations: undefined }),
      );
    });

    it('forwards true when the flag is passed', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'build',
        '--emit-declarations',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ emitDeclarations: true }),
      );
    });
  });

  describe('--bundle-dependencies', () => {
    it.each([
      [[], undefined],
      [['--bundle-dependencies'], true],
      [['--no-bundle-dependencies'], false],
    ])('forwards %j as %s', async (flags, expected) => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build', ...flags]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ bundleDependencies: expected }),
      );
    });
  });

  describe('--preserveWatchOutput', () => {
    it('stays undefined in tsc watch mode when the flag is absent, so the tsconfig value can apply', async () => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build', '--watch', '--tsc']);

      expect(action.handle.mock.calls[0][0].preserveWatchOutput).toBe(
        undefined,
      );
    });

    it('forwards true when the flag is passed in tsc watch mode', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'build',
        '--watch',
        '--tsc',
        '--preserveWatchOutput',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ preserveWatchOutput: true }),
      );
    });

    it('forwards false outside of tsc watch mode', async () => {
      const program = buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'build',
        '--tsc',
        '--preserveWatchOutput',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ preserveWatchOutput: false }),
      );
    });
  });

  describe('required option arguments', () => {
    it.each([
      '--builder',
      '--config',
      '--path',
      '--webpackPath',
      '--rspackPath',
    ])('rejects %s when its value is missing', async (option) => {
      await expectCommandError(
        action,
        [option],
        'commander.optionMissingArgument',
        'argument missing',
      );
    });
  });

  describe('path options', () => {
    it.each([
      ['--config', 'nest-cli.json', { config: 'nest-cli.json' }],
      ['--path', 'src/main.ts', { path: 'src/main.ts' }],
      [
        '--webpackPath',
        'webpack.config.js',
        { webpackPath: 'webpack.config.js' },
      ],
      ['--rspackPath', 'rspack.config.js', { rspackPath: 'rspack.config.js' }],
    ])('forwards the value supplied to %s', async (option, value, expected) => {
      const program = buildProgram(action);

      await program.parseAsync(['node', 'nest', 'build', option, value]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining(expected),
      );
    });
  });
});
