import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
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
      raw: { exclude: ['node_modules'] },
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
      raw: {},
    });

    const result = provider.getByConfigFilename('tsconfig.json');

    expect(result.exclude).toEqual([]);
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
      raw: {},
    });

    provider.getByConfigFilename('custom-tsconfig.json');

    expect(mockTsBinary.getParsedCommandLineOfConfigFile).toHaveBeenCalledWith(
      expect.stringContaining('custom-tsconfig.json'),
      undefined,
      mockTsBinary.sys,
    );
  });

  it('should handle missing exclude in raw config', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue({
      options: { outDir: 'dist' },
      fileNames: ['src/main.ts'],
      projectReferences: [],
      raw: {},
    });

    const result = provider.getByConfigFilename('tsconfig.json');

    expect(result.exclude).toEqual([]);
  });

  it('should normalize exclude paths relative to the config file', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue({
      options: { outDir: 'dist' },
      fileNames: ['apps/api/src/main.ts'],
      projectReferences: [],
      raw: { exclude: ['src/generated/**', 'dist'] },
    });

    const result = provider.getByConfigFilename('apps/api/tsconfig.app.json');

    expect(result.exclude).toEqual([
      'apps/api/src/generated/**',
      'apps/api/dist',
    ]);
  });

  it('should handle wrongly typed exclude in raw config', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const mockParsedCmd = {
      options: { outDir: 'dist' },
      fileNames: ['src/main.ts'],
      projectReferences: [],
      raw: { exclude: 'not-an-array' as unknown },
    };

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue(
      mockParsedCmd,
    );

    const result1 = provider.getByConfigFilename('tsconfig.json');

    expect(result1.exclude).toEqual([]);

    mockParsedCmd.raw.exclude = [0, false];
    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue(
      mockParsedCmd,
    );

    const result2 = provider.getByConfigFilename('tsconfig.json');

    expect(result2.exclude).toEqual([]);
  });

  it('should correctly parse exclude from the real TS binary', () => {
    const configFilename = 'tsconfig.json';
    const configPath = join(process.cwd(), configFilename);
    const tsconfigContent = JSON.stringify({
      compilerOptions: {
        outDir: 'dist',
      },
      exclude: ['node_modules', 'dist'],
    });
    const parseConfigHost: ts.ParseConfigFileHost = {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: vi.fn(),
      fileExists: vi.fn((filename) => filename === configPath),
      readDirectory: vi.fn(() => []),
      readFile: vi.fn((filename) => {
        if (filename === configPath) {
          return tsconfigContent;
        }
        return undefined;
      }),
    };

    vi.mocked(existsSync).mockReturnValue(true);
    const realTypescriptLoader = {
      load: vi.fn().mockReturnValue({
        getParsedCommandLineOfConfigFile: ts.getParsedCommandLineOfConfigFile,
        sys: parseConfigHost,
      }),
    } as unknown as TypeScriptBinaryLoader;
    provider = new TsConfigProvider(realTypescriptLoader);

    const result = provider.getByConfigFilename(configFilename);

    expect(result.exclude).toEqual(['node_modules', 'dist']);
  });

  it('should preserve exclude inherited through tsconfig extends', () => {
    const baseConfigFilename = 'tsconfig.base.json';
    const configFilename = 'apps/api/tsconfig.app.json';
    const baseConfigPath = join(process.cwd(), baseConfigFilename);
    const configPath = join(process.cwd(), configFilename);
    const tsconfigContent = JSON.stringify({
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        outDir: 'dist',
      },
    });
    const baseTsconfigContent = JSON.stringify({
      exclude: ['generated/**'],
    });
    const parseConfigHost: ts.ParseConfigFileHost = {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: vi.fn(),
      fileExists: vi.fn(
        (filename) => filename === configPath || filename === baseConfigPath,
      ),
      readDirectory: vi.fn(() => []),
      readFile: vi.fn((filename) => {
        if (filename === configPath) {
          return tsconfigContent;
        }

        if (filename === baseConfigPath) {
          return baseTsconfigContent;
        }

        return undefined;
      }),
    };

    vi.mocked(existsSync).mockReturnValue(true);
    const realTypescriptLoader = {
      load: vi.fn().mockReturnValue({
        getParsedCommandLineOfConfigFile: ts.getParsedCommandLineOfConfigFile,
        sys: parseConfigHost,
      }),
    } as unknown as TypeScriptBinaryLoader;
    provider = new TsConfigProvider(realTypescriptLoader);

    const result = provider.getByConfigFilename(configFilename);

    expect(result.exclude).toEqual(['generated/**']);
  });
});
