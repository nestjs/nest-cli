import { describe, expect, it } from 'vitest';
import { swcDefaultsFactory } from '../../../../lib/compiler/defaults/swc-defaults.js';

describe('swcDefaultsFactory', () => {
  it('should set stripLeadingPaths to true when rootDir is not set', () => {
    const result = swcDefaultsFactory({}, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to true when tsOptions is undefined', () => {
    const result = swcDefaultsFactory(undefined, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to false when rootDir is set', () => {
    const result = swcDefaultsFactory({ rootDir: '.' }, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(false);
  });

  it('should set stripLeadingPaths to false when rootDir is set to a path', () => {
    const result = swcDefaultsFactory({ rootDir: './src' }, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(false);
  });

  it('should allow user to override stripLeadingPaths via builder options', () => {
    const configuration = {
      compilerOptions: {
        builder: {
          type: 'swc' as const,
          options: {
            stripLeadingPaths: true,
          },
        },
      },
    };
    const result = swcDefaultsFactory(
      { rootDir: '.' },
      configuration as any,
    );
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should use outDir from tsOptions when provided', () => {
    const result = swcDefaultsFactory({ outDir: 'build' }, undefined);
    expect(result.cliOptions.outDir).toBe('build');
  });

  it('should default outDir to dist when not provided', () => {
    const result = swcDefaultsFactory({}, undefined);
    expect(result.cliOptions.outDir).toBe('dist');
  });

  it('should use sourceRoot from configuration for filenames', () => {
    const configuration = {
      sourceRoot: 'lib',
    };
    const result = swcDefaultsFactory({}, configuration as any);
    expect(result.cliOptions.filenames).toEqual(['lib']);
  });

  it('should default filenames to src when sourceRoot is not set', () => {
    const result = swcDefaultsFactory({}, undefined);
    expect(result.cliOptions.filenames).toEqual(['src']);
  });
});
