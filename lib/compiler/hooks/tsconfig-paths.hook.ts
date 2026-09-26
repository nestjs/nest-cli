import { existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, posix } from 'path';
import * as tsPaths from 'tsconfig-paths';
import * as ts from 'typescript';
import { requiresExplicitImportExtensions } from '../helpers/requires-explicit-import-extensions.js';
import { TypeScriptBinaryLoader } from '../typescript-loader.js';

const require = createRequire(import.meta.url);

export function tsconfigPathsBeforeHookFactory(
  compilerOptions: ts.CompilerOptions,
) {
  const tsBinary = new TypeScriptBinaryLoader().load();
  const { paths = {} } = compilerOptions;
  const matcher = tsPaths.createMatchPath(
    resolveBaseUrl(compilerOptions),
    paths,
    ['main'],
  );
  const esm = requiresExplicitImportExtensions(compilerOptions, tsBinary);
  const extensions = sourceToOutputExtension(compilerOptions, tsBinary);
  // Resolution is immutable within a build, and the hook runs per import.
  const emittedPaths = new Map<string, string>();

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      const visitNode = (node: ts.Node): ts.Node => {
        if (
          tsBinary.isImportDeclaration(node) ||
          (tsBinary.isExportDeclaration(node) && node.moduleSpecifier)
        ) {
          try {
            const text = getModuleSpecifierText(node.moduleSpecifier, sf);

            if (!text) {
              return node;
            }
            const result = getNotAliasedPath(
              sf,
              matcher,
              text,
              esm,
              extensions,
              emittedPaths,
            );
            if (!result) {
              return node;
            }
            const moduleSpecifier =
              tsBinary.factory.createStringLiteral(result);
            (moduleSpecifier as any).parent = (
              node as any
            ).moduleSpecifier.parent;

            if (tsBinary.isImportDeclaration(node)) {
              const updatedNode = tsBinary.factory.updateImportDeclaration(
                node,
                node.modifiers,
                node.importClause,
                moduleSpecifier,
                node.assertClause,
              );
              (updatedNode as any).flags = node.flags;
              return updatedNode;
            } else {
              const updatedNode = tsBinary.factory.updateExportDeclaration(
                node,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                moduleSpecifier,
                node.assertClause,
              );
              // Decorator emit resolves generated export names through their source file.
              (updatedNode as any).parent = node.parent;
              (updatedNode as any).flags = node.flags;
              return updatedNode;
            }
          } catch {
            return node;
          }
        }
        return tsBinary.visitEachChild(node, visitNode, ctx);
      };
      return tsBinary.visitNode(sf, visitNode);
    };
  };
}

/**
 * TypeScript resolves "paths" against `baseUrl ?? pathsBasePath ?? cwd`
 * (`getPathsBasePath`), where "pathsBasePath" is the directory of the tsconfig
 * that declared them — the shape every project takes now that TypeScript 6
 * deprecates "baseUrl". The historical "./" fallback points at the process
 * working directory instead, so an alias declared in a tsconfig outside it
 * matches nothing and the import is emitted verbatim. The parser records
 * "pathsBasePath" only for a config that sets "paths", so a project without
 * aliases keeps the old fallback.
 */
function resolveBaseUrl(compilerOptions: ts.CompilerOptions): string {
  if (compilerOptions.baseUrl) {
    return compilerOptions.baseUrl;
  }
  const pathsBasePath = compilerOptions.pathsBasePath;
  return typeof pathsBasePath === 'string' ? pathsBasePath : './';
}

function getModuleSpecifierText(
  moduleSpecifier: ts.Expression | undefined,
  sourceFile: ts.SourceFile,
) {
  if (!moduleSpecifier) {
    return;
  }
  if (typeof (moduleSpecifier as ts.StringLiteral).text === 'string') {
    return (moduleSpecifier as ts.StringLiteral).text;
  }

  const importPathWithQuotes = moduleSpecifier.getText(sourceFile);
  if (!importPathWithQuotes) {
    return;
  }
  return importPathWithQuotes.substring(1, importPathWithQuotes.length - 1);
}

// The matcher strips the extension off the file it found, so the path it
// returns cannot be used to tell which source file that was.
function sourceToOutputExtension(
  compilerOptions: ts.CompilerOptions,
  tsBinary: typeof ts,
): Record<string, string> {
  // `jsx: preserve` leaves the syntax in place and emits `.jsx`; every other
  // mode compiles it away.
  const jsxOutput =
    compilerOptions.jsx === tsBinary.JsxEmit.Preserve ? '.jsx' : '.js';
  return {
    '.mts': '.mjs',
    '.cts': '.cjs',
    '.ts': '.js',
    '.tsx': jsxOutput,
    '.js': '.js',
    '.jsx': jsxOutput,
  };
}
const MATCHER_EXTENSIONS = ['.mts', '.cts', '.ts', '.tsx', '.js', '.jsx'];

/**
 * Resolves an alias that ESM writes with the extension the file will have
 * *after* emit. The matcher looks for `./foo.js` on disk, finds only
 * `./foo.ts`, and gives up, so the alias is emitted untouched and fails at
 * runtime. Retrying without that extension resolves it to the source file.
 */
function matchPath(matcher: tsPaths.MatchPath, text: string, esm: boolean) {
  const result = matcher(text, undefined, undefined, MATCHER_EXTENSIONS);
  if (result || !esm) {
    return result;
  }
  const withoutOutputExtension = text.replace(/\.(m|c)?js$/, '');
  return withoutOutputExtension === text
    ? undefined
    : matcher(withoutOutputExtension, undefined, undefined, MATCHER_EXTENSIONS);
}

/**
 * Probes the disk to learn which source file the matcher resolved, and returns
 * it with the extension it will carry after emit. ESM has no directory or
 * extensionless resolution, so the specifier must name the emitted file, and
 * the extension cannot be read off a path the matcher already stripped.
 */
function toEmittedPath(
  resolvedPath: string,
  extensions: Record<string, string>,
  cache: Map<string, string>,
): string {
  const cached = cache.get(resolvedPath);
  if (cached !== undefined) {
    return cached;
  }
  const entries = Object.entries(extensions);
  // An alias that names the file keeps its extension through the matcher.
  for (const [source, output] of entries) {
    if (resolvedPath.endsWith(source)) {
      return remember(
        cache,
        resolvedPath,
        resolvedPath.slice(0, -source.length) + output,
      );
    }
  }
  for (const candidate of [resolvedPath, posix.join(resolvedPath, 'index')]) {
    for (const [source, output] of entries) {
      if (existsSync(`${candidate}${source}`)) {
        return remember(cache, resolvedPath, `${candidate}${output}`);
      }
    }
  }
  return remember(cache, resolvedPath, resolvedPath);
}

function remember(
  cache: Map<string, string>,
  key: string,
  value: string,
): string {
  cache.set(key, value);
  return value;
}

function getNotAliasedPath(
  sf: ts.SourceFile,
  matcher: tsPaths.MatchPath,
  text: string,
  esm = false,
  extensions: Record<string, string> = {},
  emittedPaths = new Map<string, string>(),
) {
  let result = matchPath(matcher, text, esm);
  if (!result) {
    return;
  }
  if (process.platform === 'win32') {
    result = result.replace(/\\/g, '/');
  }
  try {
    // Installed packages (node modules) should take precedence over root files with the same name.
    // Ref: https://github.com/nestjs/nest-cli/issues/838
    const packagePath = require.resolve(text, {
      paths: [process.cwd(), ...(require.resolve.paths(text) ?? [])],
    });
    if (packagePath) {
      return text;
    }
  } catch {
    // package resolution failed, fall through to relative path
  }

  if (esm) {
    result = toEmittedPath(result, extensions, emittedPaths);
  }
  const resolvedPath = posix.relative(dirname(sf.fileName), result) || './';
  return resolvedPath[0] === '.' ? resolvedPath : './' + resolvedPath;
}
