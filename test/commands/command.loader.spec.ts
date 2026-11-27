import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub every action so no compiler, config loader or package manager is
// constructed, and record which action modules get imported.
const actions = vi.hoisted(() => {
  const imported: string[] = [];
  const handles: Record<string, ReturnType<typeof vi.fn>> = {};
  const failures = new Map<string, Error>();
  const stub = (name: string) => {
    imported.push(name);
    handles[name] = vi.fn().mockResolvedValue(undefined);
    return {
      [name]: class {
        public handle = handles[name];

        constructor() {
          const failure = failures.get(name);
          if (failure) {
            throw failure;
          }
        }
      },
    };
  };
  return { imported, handles, failures, stub };
});
vi.mock('../../actions/add.action.js', () => actions.stub('AddAction'));
vi.mock('../../actions/build.action.js', () => actions.stub('BuildAction'));
vi.mock('../../actions/deploy.action.js', () => actions.stub('DeployAction'));
vi.mock('../../actions/generate.action.js', () =>
  actions.stub('GenerateAction'),
);
vi.mock('../../actions/info.action.js', () => actions.stub('InfoAction'));
vi.mock('../../actions/new.action.js', () => actions.stub('NewAction'));
vi.mock('../../actions/start.action.js', () => actions.stub('StartAction'));
vi.mock('../../actions/upgrade.action.js', () => actions.stub('UpgradeAction'));

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
      create: () => ({ getSchematics: () => [] }),
    },
  };
});

import { CommandLoader } from '../../commands/command.loader.js';

const ProcessExitError = class extends Error {
  constructor(public code: number | undefined) {
    super(`process.exit(${code})`);
  }
};

const buildProgram = (esm: boolean) => {
  const program = new Command();
  program.exitOverride();
  if (esm) {
    (program as any).__nestCliEsm = true;
  }
  return program;
};

describe('CommandLoader', () => {
  let program: Command;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = buildProgram(false);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new ProcessExitError(code);
    }) as never);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('ESM compatibility guard', () => {
    // An older global CLI hands this loader its own commander program. That
    // program lacks the marker, and continuing would fail much later with an
    // opaque error, so the loader refuses up front with upgrade instructions.
    it('exits when the program was not created by an ESM-aware CLI', async () => {
      await expect(CommandLoader.load(program)).rejects.toBeInstanceOf(
        ProcessExitError,
      );

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('outdated'),
      );
    });

    it('logs a clear upgrade hint when the ESM guard fails', async () => {
      await expect(CommandLoader.load(program)).rejects.toBeInstanceOf(
        ProcessExitError,
      );

      const message = consoleErrorSpy.mock.calls[0][0] as string;
      expect(message).toContain('globally installed');
      expect(message).toContain('@nestjs/cli');
      expect(message).toContain('npm i -g @nestjs/cli');
    });

    it('does not register any commands when the ESM guard fails', async () => {
      await expect(CommandLoader.load(program)).rejects.toBeInstanceOf(
        ProcessExitError,
      );

      expect(program.commands).toHaveLength(0);
    });

    it('proceeds when the program carries the ESM marker', async () => {
      program = buildProgram(true);

      await CommandLoader.load(program);

      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('registered commands', () => {
    beforeEach(async () => {
      program = buildProgram(true);
      await CommandLoader.load(program);
    });

    it.each([
      ['new', 'n'],
      ['build', undefined],
      ['start', undefined],
      ['info', 'i'],
      ['add', undefined],
      ['deploy', undefined],
      ['upgrade', 'update'],
      ['generate', 'g'],
    ])('registers the "%s" command', (name, alias) => {
      const command = program.commands.find((cmd) => cmd.name() === name);

      expect(command).toBeDefined();
      if (alias) {
        expect(command!.aliases()).toContain(alias);
      }
    });

    it('registers every command exactly once', () => {
      const names = program.commands.map((cmd) => cmd.name());

      expect(new Set(names).size).toBe(names.length);
    });

    it('registers exactly the supported set of commands', () => {
      const commandNames = program.commands.map((cmd) => cmd.name()).sort();

      expect(commandNames).toEqual(
        [
          'add',
          'build',
          'deploy',
          'generate',
          'info',
          'new',
          'start',
          'upgrade',
        ].sort(),
      );
    });
  });

  describe('lazy actions', () => {
    it('imports no action while registering the commands', async () => {
      program = buildProgram(true);
      await CommandLoader.load(program);

      expect(actions.imported).toEqual([]);
    });

    it('imports only the action of the command that runs', async () => {
      program = buildProgram(true);
      await CommandLoader.load(program);
      await program.parseAsync(['node', 'nest', 'info']);

      expect(actions.imported).toEqual(['InfoAction']);
      expect(actions.handles.InfoAction).toHaveBeenCalledOnce();
    });

    it.each([
      ['info', 'InfoAction', ['info']],
      ['generate', 'GenerateAction', ['generate', 'service', 'cats']],
    ])(
      'prints the error when the %s action fails to load',
      async (_, name, args) => {
        const failure = new Error(`Cannot load ${name}`);
        actions.failures.set(name, failure);
        program = buildProgram(true);
        await CommandLoader.load(program);

        try {
          await expect(
            program.parseAsync(['node', 'nest', ...args]),
          ).rejects.toThrow(ProcessExitError);
        } finally {
          actions.failures.delete(name);
        }

        expect(consoleErrorSpy).toHaveBeenCalledOnce();
        expect(consoleErrorSpy).toHaveBeenCalledWith(failure);
        expect(exitSpy).toHaveBeenCalledWith(1);
      },
    );
  });

  describe('invalid commands', () => {
    it('exits with an error listing how to get help', async () => {
      program = buildProgram(true);
      await CommandLoader.load(program);

      consoleErrorSpy.mockClear();

      // `command:*` fires for names that match no registered command.
      expect(() => program.emit('command:*', 'unknown-cmd', [])).toThrow(
        ProcessExitError,
      );

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid command'),
        expect.any(String),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('--help'),
      );
    });
  });

  describe('options given without their value', () => {
    let errors: string[];

    const run = async (...args: string[]) => {
      program = buildProgram(true);
      program.configureOutput({ writeErr: (str) => errors.push(str) });
      await CommandLoader.load(program);
      return program.parseAsync(['node', 'nest', ...args]);
    };
    const handled = () =>
      Object.values(actions.handles).flatMap((handle) => handle.mock.calls);

    beforeEach(() => {
      errors = [];
      Object.values(actions.handles).forEach((handle) => handle.mockClear());
    });

    it.each([
      [['new', 'my-app', '--language'], '-l, --language [language]'],
      [['new', 'my-app', '--package-manager'], '--package-manager'],
      [['build', '--builder'], '-b, --builder [name]'],
      [['start', '--env-file'], '--env-file [path]'],
      [['start', '--exec'], '-e, --exec [binary]'],
      [['generate', 'controller', 'cats', '--project'], '--project'],
      [['add', 'some-lib', '--project'], '--project'],
      [['upgrade', '--tag'], '-t, --tag [tag]'],
    ])('rejects %j before any action runs', async (args, flags) => {
      await expect(run(...args)).rejects.toMatchObject({
        code: 'commander.optionMissingArgument',
        exitCode: 1,
      });

      expect(errors.join('')).toMatch(/^error: option '.+' argument missing/);
      expect(errors.join('')).toContain(flags);
      expect(handled()).toEqual([]);
    });

    // Commander leaves an option-like argument alone after a `[value]`
    // option, so a forgotten value must not turn into a real run.
    it('rejects --project followed by --dry-run instead of running for real', async () => {
      await expect(
        run('generate', 'controller', 'cats', '--project', '--dry-run'),
      ).rejects.toMatchObject({ code: 'commander.optionMissingArgument' });

      expect(handled()).toEqual([]);
    });

    it('passes values given on the command line', async () => {
      await run('start', '--env-file', '.env', '--exec', 'bun');

      expect(actions.handles.StartAction).toHaveBeenCalledWith(
        expect.objectContaining({ envFile: ['.env'], exec: 'bun' }),
      );
    });

    it.each([
      [['start', '--debug'], 'StartAction', { debug: true }],
      [['build', '--all', '--parallel'], 'BuildAction', { parallel: true }],
      [
        ['generate', 'resource', 'cats', '--crud'],
        'GenerateAction',
        { crud: true },
      ],
    ])('still accepts %j without a value', async (args, name, expected) => {
      await run(...args);

      expect(errors).toEqual([]);
      expect(actions.handles[name]).toHaveBeenCalledWith(
        expect.objectContaining(expected),
      );
    });
  });
});
