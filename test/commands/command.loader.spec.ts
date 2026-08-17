import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The loader instantiates every real action; stub them so no compiler, config
// loader or package manager is constructed while exercising the wiring.
vi.mock('../../actions/index.js', () => {
  class StubAction {
    public handle = vi.fn().mockResolvedValue(undefined);
  }
  return {
    AddAction: StubAction,
    BuildAction: StubAction,
    DeployAction: StubAction,
    GenerateAction: StubAction,
    InfoAction: StubAction,
    NewAction: StubAction,
    StartAction: StubAction,
  };
});

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
        ['add', 'build', 'deploy', 'generate', 'info', 'new', 'start'].sort(),
      );
    });
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
});
