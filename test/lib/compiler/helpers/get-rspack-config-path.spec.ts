import { describe, it, expect } from 'vitest';
import { getRspackConfigPath } from '../../../../lib/compiler/helpers/get-rspack-config-path.js';
import { Configuration } from '../../../../lib/configuration/index.js';

describe('getRspackConfigPath', () => {
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

  it('should return undefined when builder is not configured', () => {
    const config = makeConfiguration();
    const result = getRspackConfigPath(config, {}, undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when builder type is not rspack', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'webpack',
          options: { configPath: 'webpack.config.js' },
        },
      },
    });
    const result = getRspackConfigPath(config, {}, undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when builder is a string', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: 'rspack',
      },
    });
    const result = getRspackConfigPath(config, {}, undefined);
    expect(result).toBeUndefined();
  });

  it('should return configPath when builder type is rspack with options', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'rspack',
          options: { configPath: 'custom-rspack.config.ts' },
        },
      },
    });
    const result = getRspackConfigPath(config, {}, undefined);
    expect(result).toBe('custom-rspack.config.ts');
  });

  it('should return undefined when builder type is rspack but no options', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: { type: 'rspack' },
      },
    });
    const result = getRspackConfigPath(config, {}, undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when builder is rspack but configPath is not set', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: { type: 'rspack', options: {} },
      },
    });
    const result = getRspackConfigPath(config, {}, undefined);
    expect(result).toBeUndefined();
  });

  it('should resolve from project config in monorepo mode', () => {
    const config = makeConfiguration({
      monorepo: true,
      compilerOptions: {},
      projects: {
        'my-app': {
          compilerOptions: {
            builder: {
              type: 'rspack',
              options: { configPath: 'apps/my-app/rspack.config.js' },
            },
          },
        },
      },
    });
    const result = getRspackConfigPath(config, {}, 'my-app');
    expect(result).toBe('apps/my-app/rspack.config.js');
  });

  it('should return the CLI rspackPath option when provided', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'rspack',
          options: { configPath: 'rspack.config.js' },
        },
      },
    });
    const result = getRspackConfigPath(
      config,
      { rspackPath: 'custom-cli-rspack.config.ts' },
      undefined,
    );
    expect(result).toBe('custom-cli-rspack.config.ts');
  });
});
