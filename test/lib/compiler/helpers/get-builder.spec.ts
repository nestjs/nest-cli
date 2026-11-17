import { describe, it, expect } from 'vitest';
import { getBuilder } from '../../../../lib/compiler/helpers/get-builder.js';
import { Configuration } from '../../../../lib/configuration/index.js';

describe('getBuilder', () => {
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

  it('should return tsc as default builder', () => {
    const config = makeConfiguration();
    expect(getBuilder(config, {}, undefined)).toEqual({ type: 'tsc' });
  });

  it('should return builder from configuration when set as string', () => {
    const config = makeConfiguration({
      compilerOptions: { builder: 'swc' },
    });
    expect(getBuilder(config, {}, undefined)).toEqual({ type: 'swc' });
  });

  it('should return builder object from configuration when set as object', () => {
    const config = makeConfiguration({
      compilerOptions: {
        builder: {
          type: 'swc',
          options: { swcrcPath: '.swcrc' },
        },
      },
    });
    const result = getBuilder(config, {}, undefined);
    expect(result.type).toBe('swc');
    expect(result.options).toEqual({ swcrcPath: '.swcrc' });
  });

  it('should return webpack builder from configuration', () => {
    const config = makeConfiguration({
      compilerOptions: { builder: 'webpack' },
    });
    expect(getBuilder(config, {}, undefined)).toEqual({ type: 'webpack' });
  });

  it('should return rspack builder from configuration', () => {
    const config = makeConfiguration({
      compilerOptions: { builder: 'rspack' },
    });
    expect(getBuilder(config, {}, undefined)).toEqual({ type: 'rspack' });
  });

  it('should prioritize cli builder option over configuration', () => {
    const config = makeConfiguration({
      compilerOptions: { builder: 'tsc' },
    });
    expect(getBuilder(config, { builder: 'swc' }, undefined)).toEqual({
      type: 'swc',
    });
  });

  it('should normalize string builder value to object with type', () => {
    const config = makeConfiguration();
    const result = getBuilder(config, { builder: 'webpack' }, undefined);
    expect(result).toEqual({ type: 'webpack' });
    expect(typeof result).toBe('object');
    expect(result.type).toBeDefined();
  });

  it('should throw when configured builder string is invalid', () => {
    const config = makeConfiguration({
      compilerOptions: { builder: 'esbuild' as any },
    });

    expect(() => getBuilder(config, {}, undefined)).toThrow(
      'Invalid builder "esbuild". Available builders: tsc, webpack, swc, rspack.',
    );
  });

  it('should include project name when a per-project builder is invalid', () => {
    const config = makeConfiguration({
      projects: {
        api: {
          compilerOptions: {
            builder: { type: 'vite' as any },
          },
        },
      },
    });

    expect(() => getBuilder(config, {}, 'api')).toThrow(
      'Invalid builder {"type":"vite"} for project "api". Available builders: tsc, webpack, swc, rspack.',
    );
  });

  it.each([[null], [[]], [{}], [42]])(
    'should throw when configured builder has invalid shape %p',
    (invalidBuilder) => {
      const config = makeConfiguration({
        compilerOptions: { builder: invalidBuilder as any },
      });

      expect(() => getBuilder(config, {}, undefined)).toThrow(
        'Invalid builder',
      );
    },
  );

  it('should allow valid CLI --builder to override an invalid config builder', () => {
    const config = makeConfiguration({
      compilerOptions: { builder: 'esbuild' as any },
    });

    expect(getBuilder(config, { builder: 'swc' }, undefined)).toEqual({
      type: 'swc',
    });
  });
});
