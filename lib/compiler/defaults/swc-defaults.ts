import * as ts from 'typescript';
import { Configuration } from '../../configuration/index.js';

export const swcDefaultsFactory = (
  tsOptions?: ts.CompilerOptions,
  configuration?: Configuration,
  tsConfigExclude: string[] = [],
) => {
  const builderOptions =
    typeof configuration?.compilerOptions?.builder !== 'string'
      ? configuration?.compilerOptions?.builder?.options
      : {};

  return {
    swcOptions: {
      sourceMaps:
        tsOptions?.sourceMap || (tsOptions?.inlineSourceMap && 'inline'),
      module: {
        type: 'commonjs',
      },
      jsc: {
        target: 'es2021',
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          useDefineForClassFields: false,
        },
        keepClassNames: true,
        baseUrl: tsOptions?.baseUrl,
        paths: tsOptions?.paths,
      },
      minify: false,
      swcrc: true,
    },
    cliOptions: {
      outDir: tsOptions?.outDir ? convertPath(tsOptions.outDir) : 'dist',
      filenames: [configuration?.sourceRoot ?? 'src'],
      sync: false,
      extensions: ['.js', '.ts'],
      copyFiles: false,
      includeDotfiles: false,
      ignore: tsConfigExclude.length ? tsConfigExclude : undefined,
      quiet: false,
      watch: false,
      stripLeadingPaths: shouldStripLeadingPaths(
        tsOptions?.rootDir,
        configuration?.sourceRoot ?? 'src',
      ),
      ...builderOptions,
    },
  };
};

/**
 * Mirrors tsc's output layout: tsc flattens the source directory out of the
 * output when its (effective) rootDir is the source root, so swc must strip
 * leading paths in the same cases — no rootDir configured (tsc infers the
 * common source directory), or a rootDir that points at the source root
 * (relative or resolved absolute). A rootDir above the source root (e.g. '.')
 * keeps the source directory in the output, so nothing is stripped.
 */
function shouldStripLeadingPaths(
  rootDir: string | undefined,
  sourceRoot: string,
): boolean {
  if (!rootDir) {
    return true;
  }
  const normalizedRootDir = convertPath(rootDir).replace(/\/+$/, '');
  const normalizedSourceRoot = convertPath(sourceRoot)
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
  return (
    normalizedRootDir === normalizedSourceRoot ||
    normalizedRootDir.endsWith(`/${normalizedSourceRoot}`)
  );
}

/**
 * Converts Windows specific file paths to posix
 * @param windowsPath
 */
function convertPath(windowsPath: string) {
  return windowsPath
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/\/+/g, '/');
}
