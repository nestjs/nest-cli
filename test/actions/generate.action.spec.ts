import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/utils/is-interactive.js', () => ({
  isInteractive: vi.fn(() => true),
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

const defaultConfig = () => ({
  language: 'ts',
  sourceRoot: 'src',
  collection: '@nestjs/schematics',
  entryFile: 'main',
  exec: 'node',
  projects: {},
  monorepo: false,
  compilerOptions: {},
  generateOptions: {},
});

vi.mock('../../lib/utils/load-configuration.js', () => ({
  loadConfiguration: vi.fn(),
}));

vi.mock('../../lib/utils/project-utils.js', async () => {
  const original = await vi.importActual<
    typeof import('../../lib/utils/project-utils.js')
  >('../../lib/utils/project-utils.js');
  return {
    ...original,
    askForProjectName: vi.fn(),
    hasTestingPackage: vi.fn(),
  };
});

import { GenerateAction } from '../../actions/generate.action.js';
import { GenerateCommandContext } from '../../commands/context/generate.context.js';
import { SchematicOption } from '../../lib/schematics/index.js';
import { isInteractive } from '../../lib/utils/is-interactive.js';
import { loadConfiguration } from '../../lib/utils/load-configuration.js';
import {
  askForProjectName,
  hasTestingPackage,
} from '../../lib/utils/project-utils.js';

describe('GenerateAction', () => {
  let action: GenerateAction;

  const baseContext = (
    overrides: Partial<GenerateCommandContext> = {},
  ): GenerateCommandContext => ({
    schematic: 'resource',
    name: 'users',
    path: undefined,
    dryRun: false,
    flat: false,
    spec: { value: true, passedAsInput: false },
    specFileSuffix: undefined,
    collection: undefined,
    project: undefined,
    skipImport: false,
    format: false,
    ...overrides,
  });

  const findOption = (
    schematicOptions: SchematicOption[],
    name: string,
  ): SchematicOption | undefined =>
    schematicOptions.find(
      (opt) =>
        opt.toCommandString().startsWith(`--${name}=`) ||
        opt.toCommandString() === `--${name}`,
    );

  beforeEach(() => {
    mockExecute.mockClear();
    vi.mocked(loadConfiguration).mockResolvedValue(defaultConfig() as any);
    vi.mocked(askForProjectName).mockReset();
    vi.mocked(hasTestingPackage).mockReturnValue(true);
    vi.mocked(isInteractive).mockReturnValue(true);
    action = new GenerateAction();
  });

  describe('without a TTY', () => {
    let info: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.mocked(isInteractive).mockReturnValue(false);
      info = vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      info.mockRestore();
    });

    it("keeps the schematic's prompts away, saying which defaults they took", async () => {
      await action.handle(baseContext());

      expect(mockExecute.mock.calls[0][2]).toBe('--no-interactive');
      expect(info).toHaveBeenCalledWith(
        expect.stringContaining('--type rest, --crud'),
      );
    });

    it('says nothing when the flags answered every prompt', async () => {
      await action.handle(baseContext({ type: 'ws', crud: false }));

      expect(mockExecute.mock.calls[0][2]).toBe('--no-interactive');
      expect(info).not.toHaveBeenCalled();
    });

    it('fails before running the schematic when there is no name', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        action.handle(baseContext({ name: undefined })),
      ).rejects.toThrow('nest generate resource <name>');
      expect(mockExecute).not.toHaveBeenCalled();
      error.mockRestore();
    });

    it('forwards --prefix to the library schematic', async () => {
      await action.handle(
        baseContext({ schematic: 'library', name: 'shared', prefix: '@acme' }),
      );

      const [, schematicOptions] = mockExecute.mock.calls[0];
      expect(findOption(schematicOptions, 'prefix')!.toCommandString()).toBe(
        '--prefix="@acme"',
      );
      expect(info).not.toHaveBeenCalled();
    });

    it('generates in the default project of a monorepo instead of asking', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        ...defaultConfig(),
        monorepo: true,
        sourceRoot: 'apps/api/src',
        projects: {
          api: {
            type: 'application',
            root: 'apps/api',
            sourceRoot: 'apps/api/src',
          },
          worker: {
            type: 'application',
            root: 'apps/worker',
            sourceRoot: 'apps/worker/src',
          },
        },
      } as any);

      await action.handle(baseContext({ schematic: 'service', name: 'users' }));

      expect(askForProjectName).not.toHaveBeenCalled();
      const [, schematicOptions] = mockExecute.mock.calls[0];
      expect(
        findOption(schematicOptions, 'source-root')!.toCommandString(),
      ).toBe('--source-root="apps/api/src"');
      expect(info).toHaveBeenCalledWith(
        expect.stringContaining('default project, api. Pass --project'),
      );
    });
  });

  describe('spec files in a project without @nestjs/testing', () => {
    const specOption = () => {
      const [, schematicOptions] = mockExecute.mock.calls[0];
      return findOption(schematicOptions, 'spec')!.toCommandString();
    };

    beforeEach(() => {
      vi.mocked(hasTestingPackage).mockReturnValue(false);
    });

    it('should not generate them by default', async () => {
      await action.handle(baseContext());

      expect(specOption()).toBe('--spec=false');
    });

    it('should generate them when --spec is passed', async () => {
      await action.handle(
        baseContext({ spec: { value: true, passedAsInput: true } }),
      );

      expect(specOption()).toBe('--spec');
    });

    it('should generate them when nest-cli.json asks for them', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        ...defaultConfig(),
        generateOptions: { spec: true },
      } as any);

      await action.handle(baseContext());

      expect(specOption()).toBe('--spec');
    });

    it('should still generate them in a project that has it', async () => {
      vi.mocked(hasTestingPackage).mockReturnValue(true);

      await action.handle(baseContext());

      expect(specOption()).toBe('--spec');
    });
  });

  describe('--type option', () => {
    it('should forward --type to the schematic when provided', async () => {
      await action.handle(baseContext({ type: 'rest' }));

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [, schematicOptions] = mockExecute.mock.calls[0];
      const typeOption = findOption(schematicOptions, 'type');
      expect(typeOption).toBeDefined();
      expect(typeOption!.toCommandString()).toBe('--type="rest"');
    });

    it('should not forward --type when undefined', async () => {
      await action.handle(baseContext({ type: undefined }));

      const [, schematicOptions] = mockExecute.mock.calls[0];
      const typeOption = findOption(schematicOptions, 'type');
      expect(typeOption).toBeUndefined();
    });
  });

  describe('--crud option', () => {
    it('should forward --crud to the schematic when true', async () => {
      await action.handle(baseContext({ crud: true }));

      const [, schematicOptions] = mockExecute.mock.calls[0];
      const crudOption = findOption(schematicOptions, 'crud');
      expect(crudOption).toBeDefined();
      expect(crudOption!.toCommandString()).toBe('--crud');
    });

    it('should forward --crud=false when explicitly disabled', async () => {
      // Dropping an explicit `false` lets the schematic fall back to its own
      // default (crud: true) and generate the scaffolding the user opted out of.
      await action.handle(baseContext({ crud: false }));

      const [, schematicOptions] = mockExecute.mock.calls[0];
      const crudOption = schematicOptions.find(
        (opt: SchematicOption) => opt.toCommandString() === '--crud=false',
      );
      expect(crudOption).toBeDefined();
    });

    it('should not forward --crud when undefined', async () => {
      await action.handle(baseContext({ crud: undefined }));

      const [, schematicOptions] = mockExecute.mock.calls[0];
      const crudOption = findOption(schematicOptions, 'crud');
      expect(crudOption).toBeUndefined();
    });
  });

  it('should support --type and --crud together on the resource schematic', async () => {
    await action.handle(
      baseContext({ schematic: 'resource', type: 'rest', crud: true }),
    );

    const [schematicName, schematicOptions] = mockExecute.mock.calls[0];
    expect(schematicName).toBe('resource');
    expect(findOption(schematicOptions, 'type')!.toCommandString()).toBe(
      '--type="rest"',
    );
    expect(findOption(schematicOptions, 'crud')!.toCommandString()).toBe(
      '--crud',
    );
  });

  describe('per-project generateOptions resolution', () => {
    it('should apply the default project generateOptions when selected interactively', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        ...defaultConfig(),
        monorepo: true,
        sourceRoot: 'apps/api/src',
        projects: {
          api: {
            type: 'application',
            root: 'apps/api',
            sourceRoot: 'apps/api/src',
            generateOptions: {
              spec: false,
              flat: true,
              specFileSuffix: 'e2e-spec',
              baseDir: 'modules',
            },
          },
          worker: {
            type: 'application',
            root: 'apps/worker',
            sourceRoot: 'apps/worker/src',
          },
        },
      } as any);
      vi.mocked(askForProjectName).mockResolvedValue('api [ Default ]' as any);

      await action.handle(baseContext({ schematic: 'service', name: 'users' }));

      const [, schematicOptions] = mockExecute.mock.calls[0];
      expect(
        findOption(schematicOptions, 'source-root')!.toCommandString(),
      ).toBe(`--source-root="${path.join('apps/api/src', 'modules')}"`);
      expect(findOption(schematicOptions, 'spec')!.toCommandString()).toBe(
        '--spec=false',
      );
      expect(findOption(schematicOptions, 'flat')!.toCommandString()).toBe(
        '--flat',
      );
      expect(
        findOption(schematicOptions, 'spec-file-suffix')!.toCommandString(),
      ).toBe('--spec-file-suffix="e2e-spec"');
    });

    it('should resolve generateOptions.baseDir per project and fall back to root baseDir', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        ...defaultConfig(),
        monorepo: true,
        sourceRoot: 'apps/api/src',
        generateOptions: {
          baseDir: 'shared-modules',
        },
        projects: {
          api: {
            type: 'application',
            root: 'apps/api',
            sourceRoot: 'apps/api/src',
            generateOptions: {
              baseDir: 'api-modules',
            },
          },
          worker: {
            type: 'application',
            root: 'apps/worker',
            sourceRoot: 'apps/worker/src',
          },
        },
      } as any);

      await action.handle(
        baseContext({ schematic: 'service', name: 'users', project: 'api' }),
      );
      let [, schematicOptions] = mockExecute.mock.calls[0];
      expect(
        findOption(schematicOptions, 'source-root')!.toCommandString(),
      ).toBe(`--source-root="${path.join('apps/api/src', 'api-modules')}"`);

      mockExecute.mockClear();
      await action.handle(
        baseContext({ schematic: 'service', name: 'users', project: 'worker' }),
      );
      [, schematicOptions] = mockExecute.mock.calls[0];
      expect(
        findOption(schematicOptions, 'source-root')!.toCommandString(),
      ).toBe(
        `--source-root="${path.join('apps/worker/src', 'shared-modules')}"`,
      );
    });
  });

  describe('failures', () => {
    it('rethrows when the schematic fails', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue(defaultConfig() as any);
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockExecute.mockRejectedValueOnce(new Error('schematic failed'));

      await expect(action.handle(baseContext())).rejects.toThrow(
        'schematic failed',
      );
      expect(consoleError).toHaveBeenCalledTimes(1);
      consoleError.mockRestore();
    });

    it('prints an error thrown before the schematic runs', async () => {
      vi.mocked(loadConfiguration).mockRejectedValueOnce(
        new Error('invalid configuration'),
      );
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      await expect(action.handle(baseContext())).rejects.toThrow(
        'invalid configuration',
      );
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(String(consoleError.mock.calls[0][0])).toContain(
        'invalid configuration',
      );
      consoleError.mockRestore();
    });
  });
});
