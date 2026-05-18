import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/schematics/index.js', () => ({
  Collection: { NESTJS: '@nestjs/schematics' },
  CollectionFactory: {
    create: () => ({
      execute: vi.fn().mockResolvedValue(undefined),
      getSchematics: () => [],
    }),
  },
  AbstractCollection: class {},
  AbstractRunner: class {},
}));

vi.mock('../../lib/utils/load-configuration.js', () => ({
  loadConfiguration: vi.fn().mockResolvedValue({
    language: 'ts',
    sourceRoot: 'src',
    collection: '@nestjs/schematics',
    entryFile: 'main',
    exec: 'node',
    projects: {},
    monorepo: false,
    compilerOptions: {},
    generateOptions: {},
  }),
}));

import { Command } from 'commander';
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
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new ProcessExitError(code);
    }) as never);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('ESM guard', () => {
    it('exits with code 1 when the program is not marked as ESM-aware', async () => {
      const program = buildProgram(false);

      await expect(CommandLoader.load(program)).rejects.toBeInstanceOf(
        ProcessExitError,
      );

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('logs a clear upgrade hint when the ESM guard fails', async () => {
      const program = buildProgram(false);

      await expect(CommandLoader.load(program)).rejects.toBeInstanceOf(
        ProcessExitError,
      );

      const message = consoleErrorSpy.mock.calls[0][0] as string;
      expect(message).toContain('globally installed');
      expect(message).toContain('@nestjs/cli');
      expect(message).toContain('npm i -g @nestjs/cli');
    });

    it('does not register any commands when the ESM guard fails', async () => {
      const program = buildProgram(false);

      await expect(CommandLoader.load(program)).rejects.toBeInstanceOf(
        ProcessExitError,
      );

      expect(program.commands).toHaveLength(0);
    });
  });

  describe('command registration', () => {
    it('registers every supported command when the program is ESM-aware', async () => {
      const program = buildProgram(true);

      await CommandLoader.load(program);

      const commandNames = program.commands.map((cmd) => cmd.name()).sort();
      expect(commandNames).toEqual(
        ['add', 'build', 'generate', 'info', 'new', 'start'].sort(),
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleInvalidCommand', () => {
    it('exits with code 1 and reports an error when an unknown command is dispatched', async () => {
      const program = buildProgram(true);
      await CommandLoader.load(program);

      consoleErrorSpy.mockClear();

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
