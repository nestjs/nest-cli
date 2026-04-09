import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(() => '80'),
}));

vi.mock('fs', async () => {
  const actualFs = await vi.importActual('fs');
  return {
    ...actualFs,
    accessSync: vi.fn(),
    existsSync: vi.fn(() => false),
    promises: {
      writeFile: vi.fn(),
    },
  };
});

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
}));

const mockExecute = vi.fn().mockResolvedValue(undefined);
vi.mock('../../lib/schematics/index.js', async () => {
  const original = await vi.importActual('../../lib/schematics/index.js');
  return {
    ...original,
    CollectionFactory: {
      create: () => ({
        execute: mockExecute,
      }),
    },
  };
});

vi.mock('../../lib/package-managers/index.js', () => ({
  PackageManagerFactory: {
    create: () => ({
      install: vi.fn().mockResolvedValue(undefined),
    }),
  },
  PackageManager: {
    NPM: 'npm',
  },
}));

vi.mock('../../lib/runners/git.runner.js', () => ({
  GitRunner: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { NewAction } from '../../actions/new.action.js';
import { NewCommandContext } from '../../commands/context/new.context.js';
import { SchematicOption } from '../../lib/schematics/index.js';

describe('NewAction', () => {
  let action: NewAction;
  const originalExit = process.exit;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn() as any;
    action = new NewAction();
  });

  afterEach(() => {
    process.exit = originalExit;
  });

  const baseContext = (overrides: Partial<NewCommandContext> = {}): NewCommandContext => ({
    name: 'test-project',
    directory: undefined,
    dryRun: false,
    skipGit: false,
    skipInstall: true,
    skipTests: false,
    packageManager: 'npm',
    language: 'ts',
    collection: '@nestjs/schematics',
    strict: false,
    ...overrides,
  });

  describe('--skip-tests flag', () => {
    it('should pass --no-spec to schematics when --skip-tests is true', async () => {
      const context = baseContext({ skipTests: true });
      await action.handle(context);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [schematicName, schematicOptions] = mockExecute.mock.calls[0];

      expect(schematicName).toBe('application');

      const specOption = schematicOptions.find(
        (opt: SchematicOption) => opt.toCommandString() === '--no-spec',
      );
      expect(specOption).toBeDefined();
    });

    it('should not pass --no-spec to schematics when --skip-tests is false', async () => {
      const context = baseContext({ skipTests: false });
      await action.handle(context);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [, schematicOptions] = mockExecute.mock.calls[0];

      const specOption = schematicOptions.find(
        (opt: SchematicOption) =>
          opt.toCommandString() === '--no-spec' ||
          opt.toCommandString() === '--spec',
      );
      expect(specOption).toBeUndefined();
    });

    it('should not forward skip-tests as a schematic option', async () => {
      const context = baseContext({ skipTests: true });
      await action.handle(context);

      const [, schematicOptions] = mockExecute.mock.calls[0];

      const skipTestsOption = schematicOptions.find(
        (opt: SchematicOption) =>
          opt.toCommandString().includes('skip-tests'),
      );
      expect(skipTestsOption).toBeUndefined();
    });
  });
});
