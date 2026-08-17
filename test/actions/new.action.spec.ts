import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  confirm: vi.fn(),
}));

vi.mock('../../lib/utils/is-interactive.js', () => ({
  isInteractive: vi.fn(() => false),
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

vi.mock('../../lib/runners/git.runner.js', () => {
  return {
    GitRunner: class {
      run = vi.fn().mockResolvedValue(undefined);
    },
  };
});

import { NewAction, retrieveCols } from '../../actions/new.action.js';
import { NewCommandContext } from '../../commands/context/new.context.js';
import { SchematicOption } from '../../lib/schematics/index.js';
import { execSync } from 'child_process';
import { confirm } from '@inquirer/prompts';
import { isInteractive } from '../../lib/utils/is-interactive.js';

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

  const baseContext = (
    overrides: Partial<NewCommandContext> = {},
  ): NewCommandContext => ({
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
    it('should pass --spec=false to schematics when --skip-tests is true', async () => {
      const context = baseContext({ skipTests: true });
      await action.handle(context);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [schematicName, schematicOptions] = mockExecute.mock.calls[0];

      expect(schematicName).toBe('application');

      const specOption = schematicOptions.find(
        (opt: SchematicOption) => opt.toCommandString() === '--spec=false',
      );
      expect(specOption).toBeDefined();
    });

    it('should not pass spec option to schematics when --skip-tests is false', async () => {
      const context = baseContext({ skipTests: false });
      await action.handle(context);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [, schematicOptions] = mockExecute.mock.calls[0];

      const specOption = schematicOptions.find(
        (opt: SchematicOption) =>
          opt.toCommandString() === '--spec=false' ||
          opt.toCommandString() === '--spec',
      );
      expect(specOption).toBeUndefined();
    });

    it('should not forward skip-tests as a schematic option', async () => {
      const context = baseContext({ skipTests: true });
      await action.handle(context);

      const [, schematicOptions] = mockExecute.mock.calls[0];

      const skipTestsOption = schematicOptions.find((opt: SchematicOption) =>
        opt.toCommandString().includes('skip-tests'),
      );
      expect(skipTestsOption).toBeUndefined();
    });
  });

  describe('retrieveCols', () => {
    const originalColumns = process.stdout.columns;

    afterEach(() => {
      Object.defineProperty(process.stdout, 'columns', {
        value: originalColumns,
        configurable: true,
        writable: true,
      });
    });

    it('should return process.stdout.columns when set to a positive number', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 132,
        configurable: true,
        writable: true,
      });

      expect(retrieveCols()).toBe(132);
      // tput should never be spawned when stdout.columns is usable.
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should fall back to tput cols when stdout.columns is undefined', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      vi.mocked(execSync).mockReturnValueOnce('120' as any);

      expect(retrieveCols()).toBe(120);
      expect(execSync).toHaveBeenCalledWith('tput cols', expect.any(Object));
    });

    it('should fall back to tput cols when stdout.columns is zero (not a TTY)', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 0,
        configurable: true,
        writable: true,
      });
      vi.mocked(execSync).mockReturnValueOnce('100' as any);

      expect(retrieveCols()).toBe(100);
    });

    it('should return default 80 when neither stdout.columns nor tput is usable', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error('tput: command not found');
      });

      expect(retrieveCols()).toBe(80);
    });
  });

  describe('observability (@nestjs/observe)', () => {
    const observeOption = () => {
      const [, schematicOptions] = mockExecute.mock.calls[0];
      return (schematicOptions as SchematicOption[]).find((opt) =>
        opt.toCommandString().startsWith('--observe'),
      );
    };

    it('forwards --observe to the application schematic when enabled', async () => {
      await action.handle(baseContext({ observe: true }));

      expect(observeOption()?.toCommandString()).toBe('--observe');
    });

    it('sends nothing to the schematic when disabled', async () => {
      await action.handle(baseContext({ observe: false }));

      expect(observeOption()).toBeUndefined();
    });

    it('does not prompt when the flag already answered the question', async () => {
      await action.handle(baseContext({ observe: true }));

      expect(confirm).not.toHaveBeenCalled();
    });

    it('prompts when neither flag was passed and a TTY is available', async () => {
      vi.mocked(isInteractive).mockReturnValue(true);
      vi.mocked(confirm).mockResolvedValue(true as never);

      await action.handle(baseContext({ observe: undefined }));

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(observeOption()?.toCommandString()).toBe('--observe');
    });

    it('respects a declined prompt', async () => {
      vi.mocked(isInteractive).mockReturnValue(true);
      vi.mocked(confirm).mockResolvedValue(false as never);

      await action.handle(baseContext({ observe: undefined }));

      expect(observeOption()).toBeUndefined();
    });

    it('skips the prompt without a TTY so scripted runs cannot hang', async () => {
      // `nest new` is run non-interactively by CI and by the e2e suite; a
      // prompt there would block forever with nobody to answer it.
      vi.mocked(isInteractive).mockReturnValue(false);

      await action.handle(baseContext({ observe: undefined }));

      expect(confirm).not.toHaveBeenCalled();
      expect(observeOption()).toBeUndefined();
    });
  });
});
