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
      generateOptions: {},
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
      generateOptions: {},
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
      generateOptions: {},
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
      generateOptions: {},
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
      generateOptions: {},
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
      generateOptions: {},
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
      generateOptions: {},
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
      generateOptions: {},
    };
    value = getValueOrDefault(
      configuration,
      'compilerOptions.webpack',
      'test-project',
    );
    expect(value).toBeUndefined();
  });

  it('should concatenate property path when app name contains dots', async () => {
    let configuration: Required<Configuration> = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      projects: {
        'test.project.v1.api': {
          sourceRoot: 'apps/test.project.v1.api/src',
          compilerOptions: {
            tsConfigPath: 'apps/test.project.v1.api/tsconfig.app.json',
          },
        },
      },
      language: '',
      collection: '',
      compilerOptions: {
        webpack: true,
      },
      generateOptions: {},
    };
    const sourceRoot = getValueOrDefault(
      configuration,
      'sourceRoot',
      'test.project.v1.api',
    );
    const tsConfigPath = getValueOrDefault(
      configuration,
      'compilerOptions.tsConfigPath',
      'test.project.v1.api',
    );
    expect(sourceRoot).toEqual(
      configuration.projects['test.project.v1.api'].sourceRoot,
    );
    expect(tsConfigPath).toEqual(
      configuration.projects['test.project.v1.api'].compilerOptions!
        .tsConfigPath,
    );
  });
});
