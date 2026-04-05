import { TsConfigProvider } from '../../../../lib/compiler/helpers/tsconfig-provider';
import { TypeScriptBinaryLoader } from '../../../../lib/compiler/typescript-loader';
import { join } from 'path';
import * as fs from 'fs';

jest.mock('fs');

describe('TsConfigProvider', () => {
  let provider: TsConfigProvider;
  let typescriptLoaderMock: {load: jest.SpyInstance};
  let tsBinaryMock: {getParsedCommandLineOfConfigFile: jest.Mock; sys: object};

  beforeEach(() => {
    const typescriptLoader = new TypeScriptBinaryLoader();
    provider = new TsConfigProvider(typescriptLoader);
    tsBinaryMock = {
      getParsedCommandLineOfConfigFile: jest.fn(),
      sys: {},
    };

    typescriptLoaderMock = {
      load: jest
        .spyOn(typescriptLoader, 'load')
        .mockReturnValue(tsBinaryMock as any)
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('getByConfigFilename', () => {
    it('should throw an error if config file does not exist', () => {
      const configFilename = 'tsconfig.json';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => provider.getByConfigFilename(configFilename)).toThrow(
        'Could not find TypeScript configuration file',
      );
    });

    it('should return parsed command line if config file exists', () => {
      const configFilename = 'tsconfig.json';
      const configPath = join(process.cwd(), configFilename);
      const mockParsedCmd = {
        options: { outDir: 'dist' },
        fileNames: ['src/main.ts'],
        projectReferences: [],
        raw: { exclude: ['node_modules'] },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      tsBinaryMock.getParsedCommandLineOfConfigFile.mockReturnValue(mockParsedCmd);

      const result = provider.getByConfigFilename(configFilename);

      expect(fs.existsSync).toHaveBeenCalledWith(configPath);
      expect(typescriptLoaderMock.load).toHaveBeenCalled();
      expect(tsBinaryMock.getParsedCommandLineOfConfigFile).toHaveBeenCalledWith(
        configPath,
        undefined,
        tsBinaryMock.sys,
      );
      expect(result).toEqual({
        options: {
          outDir: 'dist',
          exclude: ['node_modules'],
        },
        fileNames: ['src/main.ts'],
        projectReferences: [],
      });
    });

    it('should handle missing exclude in raw config', () => {
      const configFilename = 'tsconfig.json';
      const mockParsedCmd = {
        options: { outDir: 'dist' },
        fileNames: ['src/main.ts'],
        projectReferences: [],
        raw: {},
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      tsBinaryMock.getParsedCommandLineOfConfigFile.mockReturnValue(mockParsedCmd);

      const result = provider.getByConfigFilename(configFilename);

      expect(result.options.exclude).toEqual([]);
    });

    it('should handle wrongly typed exclude in raw config', () => {
      const configFilename = 'tsconfig.json';
      const mockParsedCmd = {
        options: { outDir: 'dist' },
        fileNames: ['src/main.ts'],
        projectReferences: [],
        raw: { exclude: 'not-an-array' as unknown as string[] },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      tsBinaryMock.getParsedCommandLineOfConfigFile.mockReturnValue(mockParsedCmd);

      const result1 = provider.getByConfigFilename(configFilename);

      expect(result1.options.exclude).toEqual([]);

      mockParsedCmd.raw.exclude = [0, false] as unknown as string[];
      tsBinaryMock.getParsedCommandLineOfConfigFile.mockReturnValue(mockParsedCmd);

      const result2 = provider.getByConfigFilename(configFilename);

      expect(result2.options.exclude).toEqual([]);
    });

    it('should correctly parse the config from the real TS binary', () => {
      const configFilename = 'tsconfig.json';
      const configPath = join(process.cwd(), configFilename);
      const tsconfigContent = JSON.stringify({
        compilerOptions: {
          outDir: 'dist',
        },
        exclude: ['node_modules', 'dist'],
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(tsconfigContent);
      typescriptLoaderMock.load.mockRestore();

      const result = provider.getByConfigFilename(configFilename);

      expect(result.options.outDir).toContain('dist');
      expect(result.options.exclude).toEqual(['node_modules', 'dist']);
      expect(result.fileNames).toBeDefined();

      expect(fs.readFileSync).toHaveBeenCalledWith(configPath);
    });
  });
});
