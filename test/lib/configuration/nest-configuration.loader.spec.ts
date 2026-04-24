import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Configuration, ConfigurationLoader } from '../../../lib/configuration/index.js';
import { NestConfigurationLoader } from '../../../lib/configuration/nest-configuration.loader.js';
import { Reader } from '../../../lib/readers/index.js';

describe('Nest Configuration Loader', () => {
  let reader: Reader;
  beforeAll(() => {
    const mock = vi.fn();
    mock.mockImplementation(() => {
      return {
        readAnyOf: vi.fn(() =>
          JSON.stringify({
            language: 'ts',
            collection: '@nestjs/schematics',
          }),
        ),
        read: vi.fn(() =>
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

  it('should deep-merge compilerOptions with defaults', async () => {
    const readerWithCompilerOpts: Reader = {
      list: vi.fn(() => []),
      readAnyOf: vi.fn(),
      read: vi.fn(() =>
        JSON.stringify({
          compilerOptions: {
            plugins: ['my-plugin'],
          },
        }),
      ),
    };
    const loader = new NestConfigurationLoader(readerWithCompilerOpts);
    const configuration = loader.load('compiler-opts-test.json');
    expect(configuration.compilerOptions).toEqual({
      assets: [],
      builder: {
        options: {
          configPath: 'tsconfig.json',
        },
        type: 'tsc',
      },
      plugins: ['my-plugin'],
      webpack: false,
      manualRestart: false,
    });
  });

  it('should deep-merge generateOptions with defaults', async () => {
    const readerWithGenOpts: Reader = {
      list: vi.fn(() => []),
      readAnyOf: vi.fn(),
      read: vi.fn(() =>
        JSON.stringify({
          generateOptions: {
            spec: false,
          },
        }),
      ),
    };
    const loader = new NestConfigurationLoader(readerWithGenOpts);
    const configuration = loader.load('generate-opts-test.json');
    expect(configuration.generateOptions).toEqual({
      spec: false,
    });
  });

  it('should preserve all generateOptions fields when merging', async () => {
    const readerWithAllGenOpts: Reader = {
      list: vi.fn(() => []),
      readAnyOf: vi.fn(),
      read: vi.fn(() =>
        JSON.stringify({
          generateOptions: {
            spec: false,
            flat: true,
            specFileSuffix: 'test',
            baseDir: 'src',
          },
        }),
      ),
    };
    const loader = new NestConfigurationLoader(readerWithAllGenOpts);
    const configuration = loader.load('all-generate-opts-test.json');
    expect(configuration.generateOptions).toEqual({
      spec: false,
      flat: true,
      specFileSuffix: 'test',
      baseDir: 'src',
    });
  });

  it('should deep-merge both compilerOptions and generateOptions simultaneously', async () => {
    const readerWithBothOpts: Reader = {
      list: vi.fn(() => []),
      readAnyOf: vi.fn(),
      read: vi.fn(() =>
        JSON.stringify({
          compilerOptions: {
            deleteOutDir: true,
          },
          generateOptions: {
            flat: true,
          },
        }),
      ),
    };
    const loader = new NestConfigurationLoader(readerWithBothOpts);
    const configuration = loader.load('both-opts-test.json');
    expect(configuration.compilerOptions).toEqual({
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
      deleteOutDir: true,
    });
    expect(configuration.generateOptions).toEqual({
      flat: true,
    });
  });
});
