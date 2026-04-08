import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'fs';
import * as ts from 'typescript';
import { TsConfigProvider } from '../../../../lib/compiler/helpers/tsconfig-provider.js';
import { TypeScriptBinaryLoader } from '../../../../lib/compiler/typescript-loader.js';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, existsSync: vi.fn() };
});

describe('TsConfigProvider', () => {
  let provider: TsConfigProvider;
  let mockTsBinary: Record<string, any>;
  let typescriptLoader: TypeScriptBinaryLoader;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockTsBinary = {
      getParsedCommandLineOfConfigFile: vi.fn(),
      sys: {},
    };

    typescriptLoader = {
      load: vi.fn().mockReturnValue(mockTsBinary),
    } as unknown as TypeScriptBinaryLoader;

    provider = new TsConfigProvider(typescriptLoader);
  });

  it('should throw when the config file does not exist', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(() => provider.getByConfigFilename('tsconfig.json')).toThrow(
      'Could not find TypeScript configuration file "tsconfig.json"',
    );
  });

  it('should return parsed options, fileNames, and projectReferences', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const mockOptions: ts.CompilerOptions = { strict: true };
    const mockFileNames = ['src/main.ts'];
    const mockProjectReferences = [{ path: './tsconfig.lib.json' }];

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue({
      options: mockOptions,
      fileNames: mockFileNames,
      projectReferences: mockProjectReferences,
    });

    const result = provider.getByConfigFilename('tsconfig.json');

    expect(result.options).toBe(mockOptions);
    expect(result.fileNames).toBe(mockFileNames);
    expect(result.projectReferences).toBe(mockProjectReferences);
  });

  it('should throw a descriptive error when tsconfig parsing returns undefined', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue(undefined);

    expect(() => provider.getByConfigFilename('tsconfig.json')).toThrow(
      'Could not parse TypeScript configuration file "tsconfig.json"',
    );
  });

  it('should include guidance about valid JSON in the parse error message', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue(undefined);

    expect(() => provider.getByConfigFilename('tsconfig.json')).toThrow(
      /valid JSON and compiler options/,
    );
  });

  it('should handle projectReferences being undefined', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue({
      options: { strict: true },
      fileNames: ['src/main.ts'],
      projectReferences: undefined,
    });

    const result = provider.getByConfigFilename('tsconfig.json');

    expect(result.options).toEqual({ strict: true });
    expect(result.fileNames).toEqual(['src/main.ts']);
    expect(result.projectReferences).toBeUndefined();
  });

  it('should pass the config path to getParsedCommandLineOfConfigFile', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue({
      options: {},
      fileNames: [],
      projectReferences: undefined,
    });

    provider.getByConfigFilename('custom-tsconfig.json');

    expect(mockTsBinary.getParsedCommandLineOfConfigFile).toHaveBeenCalledWith(
      expect.stringContaining('custom-tsconfig.json'),
      undefined,
      mockTsBinary.sys,
    );
  });
});
