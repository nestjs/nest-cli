import { describe, it, expect } from 'vitest';
import { getValueOrDefault } from '../../../../lib/compiler/helpers/get-value-or-default.js';
import { Configuration } from '../../../../lib/configuration/index.js';

describe('getValueOrDefault', () => {
  it('should return assigned configuration value', async () => {
    let configuration: Required<Configuration> = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      exec: '',
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
      exec: '',
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
      exec: '',
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
      exec: '',
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
      exec: '',
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
      exec: '',
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
      exec: '',
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
      exec: '',
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

  it('should return false for typeCheck when explicitly set to false via --no-type-check', async () => {
    const configuration = {
      monorepo: false,
      sourceRoot: '',
      entryFile: '',
      exec: '',
      projects: {},
      language: '',
      collection: '',
      compilerOptions: {
        typeCheck: true,
      },
      generateOptions: {},
    } as unknown as Required<Configuration>;
    const options = { typeCheck: false };
    const value = getValueOrDefault(
      configuration,
      'compilerOptions.typeCheck',
      undefined,
      'typeCheck',
      options,
    );
    expect(value).toEqual(false);
  });

  it('should return true for typeCheck when explicitly set to true via --type-check', async () => {
    const configuration = {
      monorepo: false,
      sourceRoot: '',
      entryFile: '',
      exec: '',
      projects: {},
      language: '',
      collection: '',
      compilerOptions: {
        typeCheck: false,
      },
      generateOptions: {},
    } as unknown as Required<Configuration>;
    const options = { typeCheck: true };
    const value = getValueOrDefault(
      configuration,
      'compilerOptions.typeCheck',
      undefined,
      'typeCheck',
      options,
    );
    expect(value).toEqual(true);
  });

  it('should fall back to config for typeCheck when no CLI flag is passed', async () => {
    const configuration = {
      monorepo: false,
      sourceRoot: '',
      entryFile: '',
      exec: '',
      projects: {},
      language: '',
      collection: '',
      compilerOptions: {
        typeCheck: true,
      },
      generateOptions: {},
    } as unknown as Required<Configuration>;
    const options = { typeCheck: undefined };
    const value = getValueOrDefault(
      configuration,
      'compilerOptions.typeCheck',
      undefined,
      'typeCheck',
      options,
    );
    expect(value).toEqual(true);
  });

  it('should override project-level typeCheck config when --no-type-check is passed', async () => {
    const configuration = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      exec: '',
      projects: {
        'test-project': {
          compilerOptions: {
            typeCheck: true,
          },
        },
      },
      language: '',
      collection: '',
      compilerOptions: {},
      generateOptions: {},
    } as unknown as Required<Configuration>;
    const options = { typeCheck: false };
    const value = getValueOrDefault(
      configuration,
      'compilerOptions.typeCheck',
      'test-project',
      'typeCheck',
      options,
    );
    expect(value).toEqual(false);
  });

  it('should concatenate property path when app name contains dots', async () => {
    let configuration: Required<Configuration> = {
      monorepo: true,
      sourceRoot: '',
      entryFile: '',
      exec: '',
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
