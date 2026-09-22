import * as ts from 'typescript';
import { Configuration } from '../../configuration/index.js';
import { isEsmProject } from '../../utils/is-esm-project.js';

export const swcDefaultsFactory = (
  tsOptions?: ts.CompilerOptions,
  configuration?: Configuration,
  tsConfigExclude: string[] = [],
) => {
  const builderOptions =
    typeof configuration?.compilerOptions?.builder !== 'string'
      ? configuration?.compilerOptions?.builder?.options
      : {};
  const esm = resolveSwcModuleType(tsOptions) === 'es6';

  return {
    swcOptions: {
      sourceMaps:
        tsOptions?.sourceMap || (tsOptions?.inlineSourceMap && 'inline'),
      module: esm
        ? {
            type: 'es6',
            // Node's ESM resolver requires full specifiers, so give the ones
            // swc rewrites from "paths" (and any extensionless relative ones)
            // the extension of the emitted file, or "/index.js" for directories.
            resolveFully: true,
          }
        : {
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
        baseUrl: resolveBaseUrl(tsOptions),
        paths: tsOptions?.paths,
        // swc drops import attributes by default, but Node needs
        // `with { type: 'json' }` to import JSON from ES modules.
        ...(esm && { experimental: { keepImportAttributes: true } }),
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
 * Picks the module format tsc would emit for the project's `.ts` files: ES
 * modules when the package is `"type": "module"`, unless the tsconfig pins an
 * older, non-ES module kind (e.g. `"module": "commonjs"`). Projects without
 * `"type": "module"` keep CommonJS output.
 */
export function resolveSwcModuleType(
  tsOptions?: ts.CompilerOptions,
  esmPackage = isEsmProject(),
): 'es6' | 'commonjs' {
  if (!esmPackage) {
    return 'commonjs';
  }
  const moduleKind = tsOptions?.module;
  if (moduleKind !== undefined && moduleKind < ts.ModuleKind.ES2015) {
    return 'commonjs';
  }
  return 'es6';
}

/**
 * Without "baseUrl" (deprecated as of TypeScript 6), tsc resolves "paths"
 * relative to the directory of the tsconfig that declares them, which the
 * TypeScript parser exposes as "pathsBasePath". swc has no such fallback and
 * panics when "paths" is set without "jsc.baseUrl", so pass that directory.
 */
function resolveBaseUrl(tsOptions?: ts.CompilerOptions): string | undefined {
  if (tsOptions?.baseUrl || !tsOptions?.paths) {
    return tsOptions?.baseUrl;
  }
  const pathsBasePath = tsOptions.pathsBasePath;
  return typeof pathsBasePath === 'string' ? pathsBasePath : undefined;
}

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
