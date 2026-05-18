import { oxcDefaultsFactory } from '../../../../lib/compiler/defaults/oxc-defaults';

describe('oxcDefaultsFactory', () => {
  it('should set stripLeadingPaths to true when rootDir is not set', () => {
    const result = oxcDefaultsFactory({}, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to false when rootDir is set', () => {
    const result = oxcDefaultsFactory({ rootDir: './src' }, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(false);
  });

  it('should use outDir from tsOptions when provided', () => {
    const result = oxcDefaultsFactory({ outDir: 'build' }, undefined);
    expect(result.cliOptions.outDir).toBe('build');
  });

  it('should default outDir to dist when not provided', () => {
    const result = oxcDefaultsFactory({}, undefined);
    expect(result.cliOptions.outDir).toBe('dist');
  });

  it('should use sourceRoot from configuration for filenames', () => {
    const configuration = {
      sourceRoot: 'lib',
    };
    const result = oxcDefaultsFactory({}, configuration as any);
    expect(result.cliOptions.filenames).toEqual(['lib']);
  });

  it('should enable Nest decorator defaults', () => {
    const result = oxcDefaultsFactory({}, undefined);
    expect(result.transformOptions.decorator).toEqual({
      legacy: true,
      emitDecoratorMetadata: true,
    });
  });

  it('should allow user to override transform options', () => {
    const configuration = {
      compilerOptions: {
        builder: {
          type: 'oxc' as const,
          options: {
            transformOptions: {
              target: 'es2022',
            },
          },
        },
      },
    };

    const result = oxcDefaultsFactory({}, configuration as any);
    expect(result.transformOptions.target).toBe('es2022');
  });
});
