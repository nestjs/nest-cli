import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  };
});

import { GenerateAction } from '../../actions/generate.action.js';
import { GenerateCommandContext } from '../../commands/context/generate.context.js';
import { SchematicOption } from '../../lib/schematics/index.js';
import { loadConfiguration } from '../../lib/utils/load-configuration.js';
import { askForProjectName } from '../../lib/utils/project-utils.js';

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
    action = new GenerateAction();
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
});
