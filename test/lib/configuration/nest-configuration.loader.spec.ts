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
      '.nest-cli.json',
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

describe('Nest Configuration Loader - extended', () => {
  function createMockReader(
    readResult: string | undefined,
  ): Reader {
    return {
      readAnyOf: jest.fn(() => readResult),
      read: jest.fn(() => readResult),
      list: jest.fn(() => []),
    } as unknown as Reader;
  }

  it('should deep merge compilerOptions with defaults', () => {
    const reader = createMockReader(
      JSON.stringify({
        compilerOptions: {
          webpack: true,
          plugins: ['my-plugin'],
        },
      }),
    );
    const loader = new NestConfigurationLoader(reader);
    // Use unique name to avoid cache
    const config = loader.load('deep-merge-test.json');

    // User's compilerOptions should override defaults
    expect(config.compilerOptions.webpack).toBe(true);
    expect(config.compilerOptions.plugins).toEqual(['my-plugin']);
    // Default compilerOptions should be preserved
    expect(config.compilerOptions.assets).toEqual([]);
    expect(config.compilerOptions.manualRestart).toBe(false);
  });

  it('should return defaults when config file is empty object', () => {
    const reader = createMockReader(JSON.stringify({}));
    const loader = new NestConfigurationLoader(reader);
    const config = loader.load('empty-config-test.json');

    expect(config.sourceRoot).toBe('src');
    expect(config.entryFile).toBe('main');
    expect(config.language).toBe('ts');
  });

  it('should override only sourceRoot when specified', () => {
    const reader = createMockReader(
      JSON.stringify({ sourceRoot: 'custom-src' }),
    );
    const loader = new NestConfigurationLoader(reader);
    const config = loader.load('sourceroot-test.json');

    expect(config.sourceRoot).toBe('custom-src');
    expect(config.entryFile).toBe('main');
    expect(config.language).toBe('ts');
  });

  it('should preserve project-specific settings', () => {
    const reader = createMockReader(
      JSON.stringify({
        projects: {
          'my-app': {
            sourceRoot: 'apps/my-app/src',
            compilerOptions: { webpack: true },
          },
        },
      }),
    );
    const loader = new NestConfigurationLoader(reader);
    const config = loader.load('projects-test.json');

    expect(config.projects['my-app']).toBeDefined();
    expect(config.projects['my-app'].sourceRoot).toBe('apps/my-app/src');
  });

  it('should return defaults when readAnyOf returns undefined', () => {
    const reader = createMockReader(undefined as any);
    const loader = new NestConfigurationLoader(reader);
    const config = loader.load('undefined-test.json');

    expect(config.sourceRoot).toBe('src');
    expect(config.language).toBe('ts');
    expect(config.entryFile).toBe('main');
  });

  it('should cache config results for the same name', () => {
    const reader = createMockReader(
      JSON.stringify({ sourceRoot: 'cached-src' }),
    );
    const loader = new NestConfigurationLoader(reader);

    const config1 = loader.load('cache-test.json');
    const config2 = loader.load('cache-test.json');

    expect(config1).toBe(config2); // Same reference = cached
    expect(reader.read).toHaveBeenCalledTimes(1);
  });
});
