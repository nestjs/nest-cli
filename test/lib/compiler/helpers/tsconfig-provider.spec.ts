import { existsSync } from 'fs';
import * as ts from 'typescript';
import { TsConfigProvider } from '../../../../lib/compiler/helpers/tsconfig-provider';
import { TypeScriptBinaryLoader } from '../../../../lib/compiler/typescript-loader';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

describe('TsConfigProvider', () => {
  let provider: TsConfigProvider;
  let mockTsBinary: Record<string, any>;
  let typescriptLoader: TypeScriptBinaryLoader;

  beforeEach(() => {
    jest.restoreAllMocks();

    mockTsBinary = {
      getParsedCommandLineOfConfigFile: jest.fn(),
      sys: {},
    };

    typescriptLoader = {
      load: jest.fn().mockReturnValue(mockTsBinary),
    } as unknown as TypeScriptBinaryLoader;

    provider = new TsConfigProvider(typescriptLoader);
  });

  it('should throw when the config file does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    expect(() => provider.getByConfigFilename('tsconfig.json')).toThrow(
      'Could not find TypeScript configuration file "tsconfig.json"',
    );
  });

  it('should return parsed options, fileNames, and projectReferences', () => {
    (existsSync as jest.Mock).mockReturnValue(true);

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
    (existsSync as jest.Mock).mockReturnValue(true);
    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue(undefined);

    expect(() => provider.getByConfigFilename('tsconfig.json')).toThrow(
      'Could not parse TypeScript configuration file "tsconfig.json"',
    );
  });

  it('should include guidance about valid JSON in the parse error message', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue(undefined);

    expect(() => provider.getByConfigFilename('tsconfig.json')).toThrow(
      /valid JSON and compiler options/,
    );
  });

  it('should handle projectReferences being undefined', () => {
    (existsSync as jest.Mock).mockReturnValue(true);

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
    (existsSync as jest.Mock).mockReturnValue(true);

    mockTsBinary.getParsedCommandLineOfConfigFile.mockReturnValue({
      options: {},
      fileNames: [],
      projectReferences: undefined,
    });

    provider.getByConfigFilename('custom-tsconfig.json');

    expect(
      mockTsBinary.getParsedCommandLineOfConfigFile,
    ).toHaveBeenCalledWith(
      expect.stringContaining('custom-tsconfig.json'),
      undefined,
      mockTsBinary.sys,
    );
  });
});
