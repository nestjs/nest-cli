import { dirname, posix } from 'path';
import tsPaths = require('tsconfig-paths');
import * as ts from 'typescript';
import { TypeScriptBinaryLoader } from '../typescript-loader';

export function tsconfigPathsBeforeHookFactory(
  compilerOptions: ts.CompilerOptions,
) {
  const tsBinary = new TypeScriptBinaryLoader().load();
  const { paths = {}, baseUrl = './' } = compilerOptions;
  const matcher = tsPaths.createMatchPath(baseUrl!, paths, ['main']);

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      const visitNode = (node: ts.Node): ts.Node => {
        if (
          tsBinary.isImportDeclaration(node) ||
          (tsBinary.isExportDeclaration(node) && node.moduleSpecifier)
        ) {
          const newNode = tsBinary.getMutableClone(node);
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
          newNode.moduleSpecifier = tsBinary.createLiteral(result);
          return newNode;
        }
        return tsBinary.visitEachChild(node, visitNode, ctx);
      };
      return tsBinary.visitNode(sf, visitNode);
    };
  };
}

function getNotAliasedPath(
  sf: ts.SourceFile,
  matcher: tsPaths.MatchPath,
  text: string,
) {
  let result = matcher(text, undefined, undefined, ['.ts', '.js']);
  if (!result) {
    return;
  }
  result = result.replace(new RegExp('\\\\', 'g'), '/');
  const resolvedPath = posix.relative(dirname(sf.fileName), result) || './';
  return resolvedPath[0] === '.' ? resolvedPath : './' + resolvedPath;
}
