import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/schematics/index.js', () => ({
  Collection: { NESTJS: '@nestjs/schematics' },
  CollectionFactory: {
    create: () => ({
      execute: vi.fn().mockResolvedValue(undefined),
      getSchematics: () => [
        {
          name: 'controller',
          alias: 'co',
          description: 'Generate a controller declaration',
        },
        {
          name: 'service',
          alias: 's',
          description: 'Generate a service declaration',
        },
      ],
    }),
  },
}));

vi.mock('../../lib/utils/load-configuration.js', () => ({
  loadConfiguration: vi.fn().mockResolvedValue({
    collection: '@nestjs/schematics',
    sourceRoot: 'src',
    entryFile: 'main',
    exec: 'node',
    projects: {},
    monorepo: false,
    compilerOptions: {},
    generateOptions: {},
    language: 'ts',
  }),
}));

import { Command } from 'commander';
import { AbstractAction } from '../../actions/abstract.action.js';
import { GenerateCommand } from '../../commands/generate.command.js';

class FakeAction extends AbstractAction {
  public handle = vi.fn().mockResolvedValue(undefined);
}

const buildProgram = async (action: FakeAction) => {
  const program = new Command();
  program.exitOverride();
  await new GenerateCommand(action).load(program);
  return program;
};

describe('GenerateCommand', () => {
  let action: FakeAction;

  beforeEach(() => {
    action = new FakeAction();
  });

  describe('positional arguments', () => {
    it('forwards the schematic, name and path positionals to the action context', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'controller',
        'cats',
        'modules/cats',
      ]);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          schematic: 'controller',
          name: 'cats',
          path: 'modules/cats',
        }),
      );
    });

    it('responds to the "g" alias', async () => {
      const program = await buildProgram(action);

      await program.parseAsync(['node', 'nest', 'g', 'service', 'cats']);

      expect(action.handle).toHaveBeenCalledTimes(1);
      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ schematic: 'service', name: 'cats' }),
      );
    });
  });

  describe('--spec / --no-spec', () => {
    it('defaults spec to { value: true, passedAsInput: false }', async () => {
      const program = await buildProgram(action);

      await program.parseAsync(['node', 'nest', 'generate', 'service', 'cats']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: { value: true, passedAsInput: false },
        }),
      );
    });

    it('records passedAsInput: true when --spec is supplied explicitly', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--spec',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: { value: true, passedAsInput: true },
        }),
      );
    });

    it('records value: false and passedAsInput: true when --no-spec is supplied', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--no-spec',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: { value: false, passedAsInput: true },
        }),
      );
    });

    it('forwards --spec-file-suffix as specFileSuffix', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--spec-file-suffix',
        'unit',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ specFileSuffix: 'unit' }),
      );
    });
  });

  describe('--flat / --no-flat', () => {
    it('defaults flat to undefined when neither flag is supplied', async () => {
      const program = await buildProgram(action);

      await program.parseAsync(['node', 'nest', 'generate', 'service', 'cats']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ flat: undefined }),
      );
    });

    it('passes flat: true when --flat is supplied', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--flat',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ flat: true }),
      );
    });

    it('passes flat: false when --no-flat is supplied', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--no-flat',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ flat: false }),
      );
    });
  });

  describe('--type and --crud', () => {
    it('forwards --type as a string', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'resource',
        'cats',
        '--type',
        'graphql',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'graphql' }),
      );
    });

    it('passes crud: true when --crud is supplied with no value', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'resource',
        'cats',
        '--crud',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ crud: true }),
      );
    });

    it('passes crud: undefined when no --crud flag is present', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'resource',
        'cats',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ crud: undefined }),
      );
    });
  });

  describe('miscellaneous flags', () => {
    it('forwards --dry-run, --project and --collection', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--dry-run',
        '--project',
        'apps/api',
        '--collection',
        '@custom/schematics',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          dryRun: true,
          project: 'apps/api',
          collection: '@custom/schematics',
        }),
      );
    });

    it('passes skipImport: true when --skip-import is supplied', async () => {
      const program = await buildProgram(action);

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--skip-import',
      ]);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ skipImport: true }),
      );
    });

    it('defaults skipImport to false when --skip-import is omitted', async () => {
      const program = await buildProgram(action);

      await program.parseAsync(['node', 'nest', 'generate', 'service', 'cats']);

      expect(action.handle).toHaveBeenCalledWith(
        expect.objectContaining({ skipImport: false }),
      );
    });

    it('passes format: true only when --format is provided, false otherwise', async () => {
      const program = await buildProgram(action);

      await program.parseAsync(['node', 'nest', 'generate', 'service', 'cats']);
      expect(action.handle).toHaveBeenLastCalledWith(
        expect.objectContaining({ format: false }),
      );

      await program.parseAsync([
        'node',
        'nest',
        'generate',
        'service',
        'cats',
        '--format',
      ]);
      expect(action.handle).toHaveBeenLastCalledWith(
        expect.objectContaining({ format: true }),
      );
    });
  });
});
