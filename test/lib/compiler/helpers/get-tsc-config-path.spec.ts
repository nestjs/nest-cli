import { describe, it, expect } from 'vitest';
import { getTscConfigPath } from '../../../../lib/compiler/helpers/get-tsc-config.path.js';
import { Configuration } from '../../../../lib/configuration/index.js';

describe('getTscConfigPath', () => {
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

  it('should return default tsconfig path when nothing is configured', () => {
    const config = makeConfiguration();
    const result = getTscConfigPath(config, {}, undefined);
    // Default is tsconfig.json or tsconfig.build.json depending on existence
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should return path from CLI options when provided', () => {
    const config = makeConfiguration();
    expect(
      getTscConfigPath(config, { path: 'tsconfig.custom.json' }, undefined),
    ).toBe('tsconfig.custom.json');
  });

  it('should return tsConfigPath from compilerOptions', () => {
    const config = makeConfiguration({
      compilerOptions: {
        tsConfigPath: 'tsconfig.app.json',
      },
    });
    expect(getTscConfigPath(config, {}, undefined)).toBe('tsconfig.app.json');
  });

  it('should return configPath from tsc builder options', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'tsc',
          options: {
            configPath: 'tsconfig.tsc-builder.json',
          },
        },
      },
    });
    expect(getTscConfigPath(config, {}, undefined)).toBe(
      'tsconfig.tsc-builder.json',
    );
  });

  it('should ignore builder configPath when builder type is not tsc', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'swc',
          options: {
            configPath: 'tsconfig.swc.json',
          },
        },
      },
    });
    const result = getTscConfigPath(config, {}, undefined);
    expect(result).not.toBe('tsconfig.swc.json');
  });

  it('should prioritize CLI path over all configuration values', () => {
    const config = makeConfiguration({
      compilerOptions: {
        tsConfigPath: 'from-config.json',
        builder: {
          type: 'tsc',
          options: {
            configPath: 'from-builder.json',
          },
        },
      },
    });
    expect(
      getTscConfigPath(config, { path: 'from-cli.json' }, undefined),
    ).toBe('from-cli.json');
  });

  it('should prioritize tsConfigPath over builder configPath', () => {
    const config = makeConfiguration({
      compilerOptions: {
        tsConfigPath: 'from-tsconfig-path.json',
        builder: {
          type: 'tsc',
          options: {
            configPath: 'from-builder.json',
          },
        },
      },
    });
    expect(getTscConfigPath(config, {}, undefined)).toBe(
      'from-tsconfig-path.json',
    );
  });
});
