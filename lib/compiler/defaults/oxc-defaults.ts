import * as ts from 'typescript';
import { Configuration } from '../../configuration';

export const oxcDefaultsFactory = (
  tsOptions?: ts.CompilerOptions,
  configuration?: Configuration,
) => {
  const builderOptions =
    typeof configuration?.compilerOptions?.builder !== 'string' &&
    configuration?.compilerOptions?.builder?.type === 'oxc'
      ? configuration.compilerOptions.builder.options || {}
      : {};

  const { transformOptions: userTransformOptions, ...cliBuilderOptions } =
    builderOptions;

  const useDefineForClassFields = tsOptions?.useDefineForClassFields ?? false;

  return {
    transformOptions: {
      cwd: process.cwd(),
      sourceType: 'unambiguous' as const,
      target: 'es2021',
      sourcemap: !!(tsOptions?.sourceMap || tsOptions?.inlineSourceMap),
      assumptions: {
        setPublicClassFields: !useDefineForClassFields,
      },
      typescript: {
        allowNamespaces: true,
        removeClassFieldsWithoutInitializer: !useDefineForClassFields,
      },
      decorator: {
        legacy: tsOptions?.experimentalDecorators ?? true,
        emitDecoratorMetadata: tsOptions?.emitDecoratorMetadata ?? true,
      },
      ...userTransformOptions,
    },
    cliOptions: {
      outDir: tsOptions?.outDir ? convertPath(tsOptions.outDir) : 'dist',
      filenames: [configuration?.sourceRoot ?? 'src'],
      extensions: ['.js', '.ts'],
      quiet: false,
      watch: false,
      declaration: false,
      inlineSourceMap: !!tsOptions?.inlineSourceMap,
      rootDir: tsOptions?.rootDir,
      stripLeadingPaths: !tsOptions?.rootDir,
      ...cliBuilderOptions,
    },
  };
};

/**
 * Converts Windows specific file paths to posix.
 * @param windowsPath
 */
function convertPath(windowsPath: string) {
  return windowsPath
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/\/+/g, '/');
}
