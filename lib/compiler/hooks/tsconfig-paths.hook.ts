import { existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, posix } from 'path';
import * as tsPaths from 'tsconfig-paths';
import * as ts from 'typescript';
import { requiresExplicitImportExtensions } from '../plugins/plugin-metadata-generator.js';
import { TypeScriptBinaryLoader } from '../typescript-loader.js';

const require = createRequire(import.meta.url);

export function tsconfigPathsBeforeHookFactory(
  compilerOptions: ts.CompilerOptions,
) {
  const tsBinary = new TypeScriptBinaryLoader().load();
  const { paths = {}, baseUrl = './' } = compilerOptions;
  const matcher = tsPaths.createMatchPath(baseUrl!, paths, ['main']);
  const esm = requiresExplicitImportExtensions(compilerOptions, tsBinary);

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
            const result = getNotAliasedPath(sf, matcher, text, esm);
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

const MATCHER_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

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

// The matcher hands back the source path, which either carries a TypeScript
// extension or none at all when it resolved a directory or dropped one.
const SOURCE_TO_OUTPUT_EXTENSION: Record<string, string> = {
  '.mts': '.mjs',
  '.cts': '.cjs',
  '.ts': '.js',
  '.tsx': '.js',
};

/**
 * Gives the specifier the extension its emitted file will carry, which ESM
 * requires and the resolved source path does not always have.
 */
function withOutputExtension(specifier: string): string {
  for (const [source, output] of Object.entries(SOURCE_TO_OUTPUT_EXTENSION)) {
    if (specifier.endsWith(source)) {
      return specifier.slice(0, -source.length) + output;
    }
  }
  return posix.extname(specifier) ? specifier : `${specifier}.js`;
}

/**
 * ESM has no directory resolution: a specifier must name a file. When the
 * alias resolves to a directory, point it at the index file inside.
 */
function resolveIndexFile(resolvedPath: string): string {
  for (const extension of MATCHER_EXTENSIONS) {
    if (existsSync(posix.join(resolvedPath, `index${extension}`))) {
      return posix.join(resolvedPath, 'index');
    }
  }
  return resolvedPath;
}

function getNotAliasedPath(
  sf: ts.SourceFile,
  matcher: tsPaths.MatchPath,
  text: string,
  esm = false,
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
    result = resolveIndexFile(result);
  }
  const resolvedPath = posix.relative(dirname(sf.fileName), result) || './';
  const specifier =
    resolvedPath[0] === '.' ? resolvedPath : './' + resolvedPath;
  return esm ? withOutputExtension(specifier) : specifier;
}
