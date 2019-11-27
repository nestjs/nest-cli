import { dirname, relative } from 'path';
import tsPaths = require('tsconfig-paths');
import * as ts from 'typescript';

export function tsconfigPathsBeforeHookFactory(
  compilerOptions: ts.CompilerOptions,
) {
  const { paths = {}, baseUrl } = compilerOptions;
  const matcher = tsPaths.createMatchPath(baseUrl!, paths, ['main']);

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      const visitNode = (node: ts.Node): ts.Node => {
        if (
          ts.isImportDeclaration(node) ||
          (ts.isExportDeclaration(node) && node.moduleSpecifier)
        ) {
          const newNode = ts.getMutableClone(node);
          const importPathWithQuotes =
            node.moduleSpecifier && node.moduleSpecifier.getText();

          if (!importPathWithQuotes) {
            return node;
          }
          const text = importPathWithQuotes.substr(
            1,
            importPathWithQuotes.length - 2,
          );
          const result = getNotAliasedPath(sf, matcher, text);
          if (!result) {
            return node;
          }
          newNode.moduleSpecifier = ts.createLiteral(result);
          return newNode;
        }
        return ts.visitEachChild(node, visitNode, ctx);
      };
      return ts.visitNode(sf, visitNode);
    };
  };
}

function getNotAliasedPath(
  sf: ts.SourceFile,
  matcher: tsPaths.MatchPath,
  text: string,
) {
  const result = matcher(text, undefined, undefined, ['.ts', '.js']);
  if (!result) {
    return;
  }
  const resolvedPath = relative(dirname(sf.fileName), result) || './';
  return resolvedPath[0] === '.' ? resolvedPath : './' + resolvedPath;
}
