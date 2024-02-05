import { Configuration, ConfigurationLoader } from '../../../lib/configuration';
import { NestConfigurationLoader } from '../../../lib/configuration/nest-configuration.loader';
import { Reader } from '../../../lib/readers';

describe('Nest Configuration Loader', () => {
  let reader: Reader;
  beforeAll(() => {
    const mock = jest.fn();
    mock.mockImplementation(() => {
      return {
        readAnyOf: jest.fn(() =>
          JSON.stringify({
            language: 'ts',
            collection: '@nestjs/schematics',
          }),
        ),
        read: jest.fn(() =>
          JSON.stringify({
            language: 'ts',
            collection: '@nestjs/schematics',
            entryFile: 'secondary',
          }),
        ),
      };
    });
    reader = mock();
  });
  it('should call reader.readAnyOf when load taking "nest-cli.json" as preferable', async () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader(reader);
    const configuration: Configuration = await loader.load();
    expect(reader.readAnyOf).toHaveBeenCalledWith([
      'nest-cli.json',
      '.nestcli.json',
      '.nest-cli.json',
      'nest.json',
    ]);
    expect(configuration).toEqual({
      language: 'ts',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      entryFile: 'main',
      exec: 'node',
      monorepo: false,
      projects: {},
      compilerOptions: {
        assets: [],
        builder: {
          options: {
            configPath: 'tsconfig.json',
          },
          type: 'tsc',
        },
        plugins: [],
        webpack: false,
        manualRestart: false,
      },
      generateOptions: {},
    });
  });
  it('should call reader.read when load with filename', async () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader(reader);
    const configuration: Configuration = await loader.load(
      'nest-cli.secondary.config.json',
    );
    expect(reader.read).toHaveBeenCalledWith('nest-cli.secondary.config.json');
    expect(configuration).toEqual({
      language: 'ts',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      entryFile: 'secondary',
      exec: 'node',
      monorepo: false,
      projects: {},
      compilerOptions: {
        assets: [],
        builder: {
          options: {
            configPath: 'tsconfig.json',
          },
          type: 'tsc',
        },
        plugins: [],
        webpack: false,
        manualRestart: false,
      },
      generateOptions: {},
    });
  });
});
