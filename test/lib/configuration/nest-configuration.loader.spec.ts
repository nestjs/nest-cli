import {
  Configuration,
  ConfigurationLoader,
  configurationSchema,
  NestConfigurationLoader,
} from '../../../lib/configuration';
import { Reader } from '../../../lib/readers';

describe('Nest Configuration Loader', () => {
  let reader: Reader;
  beforeAll(() => {
    const mock = jest.fn();
    mock.mockImplementation(() => {
      return {
        readAnyOf: jest.fn(() =>
          Promise.resolve(
            JSON.stringify({
              language: 'ts',
              collection: '@nestjs/schematics',
            }),
          ),
        ),
        read: jest.fn(() =>
          Promise.resolve(
            JSON.stringify({
              language: 'ts',
              collection: '@nestjs/schematics',
              entryFile: 'secondary',
            }),
          ),
        ),
      };
    });
    reader = mock();
  });
  it('should call reader.readAnyOf when load', async () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader(
      reader,
      configurationSchema,
    );
    const configuration: Configuration = await loader.load();
    expect(reader.readAnyOf).toHaveBeenCalledWith([
      '.nestcli.json',
      '.nest-cli.json',
      'nest-cli.json',
      'nest.json',
    ]);
    expect(configuration).toEqual({
      language: 'ts',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      entryFile: 'main',
      monorepo: false,
      projects: {},
      compilerOptions: {
        assets: [],
        plugins: [],
        tsConfigPath: 'tsconfig.build.json',
        webpack: false,
        webpackConfigPath: 'webpack.config.js',
        watchAssets: false,
        deleteOutDir: false,
      },
      generateOptions: {},
    });
  });
  it('should call reader.read when load with filename', async () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader(
      reader,
      configurationSchema,
    );
    const configuration: Configuration = await loader.load(
      'nest-cli.secondary.config.json',
    );
    expect(reader.read).toHaveBeenCalledWith('nest-cli.secondary.config.json');
    expect(configuration).toEqual({
      language: 'ts',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      entryFile: 'secondary',
      monorepo: false,
      projects: {},
      compilerOptions: {
        assets: [],
        plugins: [],
        tsConfigPath: 'tsconfig.build.json',
        webpack: false,
        webpackConfigPath: 'webpack.config.js',
        watchAssets: false,
        deleteOutDir: false,
      },
      generateOptions: {},
    });
  });

  it('should throw error when appear unexpected attributes', async function () {
    const loader: ConfigurationLoader = new NestConfigurationLoader(
      {
        read(_name: string): string {
          return JSON.stringify({
            unexpected: 'xxx',
            compilerOptions: {
              anotherUnexpected: 'yyy',
            },
          });
        },
        readAnyOf(_filenames: string[]): string {
          return JSON.stringify({
            unexpected: 'xxx',
            compilerOptions: {
              anotherUnexpected: 'yyy',
            },
          });
        },
      } as Reader,
      configurationSchema,
    );
    const configuration = loader.load();
    await expect(configuration).rejects.toThrow();
  });
});
