import { beforeEach, describe, expect, it, vi } from 'vitest';

const addProduction = vi.fn().mockResolvedValue(true);
const execute = vi.fn().mockResolvedValue(undefined);

vi.mock('../../lib/package-managers/index.js', () => ({
  PackageManagerFactory: {
    find: vi.fn(async () => ({ addProduction })),
  },
}));

vi.mock('../../lib/schematics/index.js', async () => {
  const original = await vi.importActual('../../lib/schematics/index.js');
  return {
    ...original,
    CollectionFactory: { create: vi.fn(() => ({ execute })) },
  };
});

vi.mock('../../lib/utils/load-configuration.js', () => ({
  loadConfiguration: vi.fn().mockResolvedValue({
    sourceRoot: 'src',
    projects: {},
  }),
}));

vi.mock('../../lib/utils/project-utils.js', () => ({
  shouldAskForProject: vi.fn(() => false),
  askForProjectName: vi.fn(),
  moveDefaultProjectToStart: vi.fn(() => []),
}));

import { AddAction } from '../../actions/add.action.js';
import { AddCommandContext } from '../../commands/index.js';
import {
  CollectionFactory,
  SchematicOption,
} from '../../lib/schematics/index.js';
import { PackageManagerFactory } from '../../lib/package-managers/index.js';
import { loadConfiguration } from '../../lib/utils/load-configuration.js';
import {
  askForProjectName,
  shouldAskForProject,
} from '../../lib/utils/project-utils.js';

describe('AddAction flow', () => {
  let action: AddAction;

  const context = (
    overrides: Partial<AddCommandContext> = {},
  ): AddCommandContext => ({
    library: '@nestjs/config',
    dryRun: false,
    skipInstall: false,
    project: undefined,
    extraFlags: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    addProduction.mockResolvedValue(true);
    execute.mockResolvedValue(undefined);
    vi.mocked(shouldAskForProject).mockReturnValue(false);
    vi.mocked(loadConfiguration).mockResolvedValue({
      sourceRoot: 'src',
      projects: {},
    } as any);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    action = new AddAction();
  });

  describe('installation', () => {
    it('installs the library as a production dependency before adding it', async () => {
      await action.handle(context());

      expect(PackageManagerFactory.find).toHaveBeenCalled();
      expect(addProduction).toHaveBeenCalledWith(['@nestjs/config'], 'latest');
      expect(execute).toHaveBeenCalled();
    });

    it('installs the requested tag when the library carries a version', async () => {
      await action.handle(context({ library: '@nestjs/config@3.0.0' }));

      expect(addProduction).toHaveBeenCalledWith(['@nestjs/config'], '3.0.0');
    });

    it('skips installation but still runs the schematic with --skip-install', async () => {
      await action.handle(context({ skipInstall: true }));

      expect(addProduction).not.toHaveBeenCalled();
      expect(execute).toHaveBeenCalled();
    });

    it('throws a bad-package error and skips the schematic when install fails', async () => {
      addProduction.mockResolvedValue(false);

      await expect(action.handle(context())).rejects.toThrow(/@nestjs\/config/);
      expect(execute).not.toHaveBeenCalled();
    });

    it('treats a throwing package manager as a failed install', async () => {
      addProduction.mockRejectedValue(new Error('network down'));

      await expect(action.handle(context())).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('schematic invocation', () => {
    it('creates the collection from the library name', async () => {
      await action.handle(context({ library: '@nestjs/config@3.0.0' }));

      // The version must be stripped: it identifies the package to install,
      // not the schematics collection to run.
      expect(CollectionFactory.create).toHaveBeenCalledWith('@nestjs/config');
    });

    it('runs the nest-add schematic with the resolved sourceRoot', async () => {
      await action.handle(context());

      const [schematic, options] = execute.mock.calls[0];
      expect(schematic).toBe('nest-add');
      expect(
        (options as SchematicOption[]).map((opt) => opt.toCommandString()),
      ).toContain('--source-root="src"');
    });

    it('forwards library-specific extra flags as a single string', async () => {
      await action.handle(
        context({ extraFlags: ['--custom-flag', '--other=1'] }),
      );

      expect(execute.mock.calls[0][2]).toBe('--custom-flag --other=1');
    });

    it('passes no extra flag string when there are none', async () => {
      await action.handle(context({ extraFlags: [] }));

      expect(execute.mock.calls[0][2]).toBe('');
    });

    it('rethrows schematic failures so the command can exit non-zero', async () => {
      execute.mockRejectedValue(new Error('schematic blew up'));

      await expect(action.handle(context())).rejects.toThrow(
        'schematic blew up',
      );
    });
  });

  describe('source root resolution', () => {
    it('uses the sourceRoot of the requested project', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        sourceRoot: 'src',
        projects: { api: { sourceRoot: 'apps/api/src' } },
      } as any);

      await action.handle(context({ project: 'api' }));

      const options = execute.mock.calls[0][1] as SchematicOption[];
      expect(options.map((opt) => opt.toCommandString())).toContain(
        '--source-root="apps/api/src"',
      );
    });

    it('prompts for a project in a monorepo and uses the selection', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        sourceRoot: 'src',
        projects: {
          api: { sourceRoot: 'apps/api/src' },
          web: { sourceRoot: 'apps/web/src' },
        },
      } as any);
      vi.mocked(shouldAskForProject).mockReturnValue(true);
      vi.mocked(askForProjectName).mockResolvedValue('web' as any);

      await action.handle(context());

      const options = execute.mock.calls[0][1] as SchematicOption[];
      expect(options.map((opt) => opt.toCommandString())).toContain(
        '--source-root="apps/web/src"',
      );
    });
  });
});
