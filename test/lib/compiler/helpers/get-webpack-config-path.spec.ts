import { describe, it, expect } from 'vitest';
import { getWebpackConfigPath } from '../../../../lib/compiler/helpers/get-webpack-config-path.js';
import { Configuration } from '../../../../lib/configuration/index.js';

describe('getWebpackConfigPath', () => {
  const makeConfiguration = (
    overrides: Partial<Configuration> = {},
  ): Required<Configuration> =>
    ({
      language: 'ts',
      sourceRoot: 'src',
      collection: '@nestjs/schematics',
      entryFile: 'main',
      exec: 'node',
      projects: {},
      monorepo: false,
      compilerOptions: {},
      generateOptions: {},
      ...overrides,
    }) as Required<Configuration>;

  it('should return undefined when no webpack path is configured', () => {
    const config = makeConfiguration();
    expect(getWebpackConfigPath(config, {}, undefined)).toBeUndefined();
  });

  it('should return webpackPath from CLI options when provided', () => {
    const config = makeConfiguration();
    expect(
      getWebpackConfigPath(config, { webpackPath: 'custom-webpack.js' }, undefined),
    ).toBe('custom-webpack.js');
  });

  it('should return webpackConfigPath from compilerOptions', () => {
    const config = makeConfiguration({
      compilerOptions: {
        webpackConfigPath: 'webpack.custom.js',
      },
    });
    expect(getWebpackConfigPath(config, {}, undefined)).toBe(
      'webpack.custom.js',
    );
  });

  it('should return configPath from builder options when builder type is webpack', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'webpack',
          options: {
            configPath: 'builder-webpack.config.js',
          },
        },
      },
    });
    expect(getWebpackConfigPath(config, {}, undefined)).toBe(
      'builder-webpack.config.js',
    );
  });

  it('should return undefined when builder type is webpack but no configPath', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'webpack',
        },
      },
    });
    expect(getWebpackConfigPath(config, {}, undefined)).toBeUndefined();
  });

  it('should return undefined when builder type is not webpack', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'swc',
          options: {
            configPath: 'some-path.js',
          },
        },
      },
    });
    expect(getWebpackConfigPath(config, {}, undefined)).toBeUndefined();
  });

  it('should prioritize CLI webpackPath over configuration', () => {
    const config = makeConfiguration({
      compilerOptions: {
        webpackConfigPath: 'from-config.js',
      },
    });
    expect(
      getWebpackConfigPath(config, { webpackPath: 'from-cli.js' }, undefined),
    ).toBe('from-cli.js');
  });

  it('should prioritize webpackConfigPath over builder options', () => {
    const config = makeConfiguration({
      compilerOptions: {
        webpackConfigPath: 'from-compiler-options.js',
        builder: {
          type: 'webpack',
          options: {
            configPath: 'from-builder.js',
          },
        },
      },
    });
    expect(getWebpackConfigPath(config, {}, undefined)).toBe(
      'from-compiler-options.js',
    );
  });
});
