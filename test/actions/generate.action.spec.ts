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

import { GenerateAction } from '../../actions/generate.action.js';
import { GenerateCommandContext } from '../../commands/context/generate.context.js';
import { SchematicOption } from '../../lib/schematics/index.js';

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
    schematicOptions.find((opt) =>
      opt.toCommandString().startsWith(`--${name}=`) ||
      opt.toCommandString() === `--${name}`,
    );

  beforeEach(() => {
    mockExecute.mockClear();
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

    it('should not forward --crud when falsy', async () => {
      await action.handle(baseContext({ crud: false }));

      const [, schematicOptions] = mockExecute.mock.calls[0];
      const crudOption = findOption(schematicOptions, 'crud');
      expect(crudOption).toBeUndefined();
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
});
