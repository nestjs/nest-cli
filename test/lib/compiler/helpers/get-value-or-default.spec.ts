import { getValueOrDefault } from '../../../../lib/compiler/helpers/get-value-or-default';
import { Configuration } from '../../../../lib/configuration';

describe('Get Value or Default', () => {
  it('should return assigned configuration value', async () => {
    let configuration: Required<Configuration> = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {},
      language: '',
      collection: '',
      compilerOptions: {},
    };
    let value = getValueOrDefault(configuration, 'monorepo', '');
    expect(value).toEqual(true);

    configuration = {
      monorepo: false,
      sourceRoot: '',
      entryFile: '',
      projects: {},
      language: '',
      collection: '',
      compilerOptions: {},
    };
    value = getValueOrDefault(configuration, 'monorepo', '');
    expect(value).toEqual(false);

    value = getValueOrDefault(configuration, 'notfound', '');
    expect(value).toBeUndefined();
  });

  it('should return assigned project configuration value', async () => {
    let configuration: Required<Configuration> = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test-project': {
          compilerOptions: {
            webpack: true,
          },
        },
      },
      language: '',
      collection: '',
      compilerOptions: {},
    };
    let value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toEqual(true);

    configuration = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test-project': {
          compilerOptions: {
            webpack: false,
          },
        },
      },
      language: '',
      collection: '',
      compilerOptions: {},
    };
    value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toEqual(false);

    configuration = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test-project': {
          compilerOptions: {},
        },
      },
      language: '',
      collection: '',
      compilerOptions: {},
    };
    value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toBeUndefined();
  });

  it('should return default configuration value when project value not found', async () => {
    let configuration: Required<Configuration> = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test-project': {
          compilerOptions: {},
        },
      },
      language: '',
      collection: '',
      compilerOptions: {
        webpack: true,
      },
    };
    let value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toEqual(true);

    configuration = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test-project': {
          compilerOptions: {},
        },
      },
      language: '',
      collection: '',
      compilerOptions: {
        webpack: false,
      },
    };
    value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toEqual(false);

    configuration = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test-project': {
          compilerOptions: {},
        },
      },
      language: '',
      collection: '',
      compilerOptions: {},
    };
    value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toBeUndefined();
  });
});
