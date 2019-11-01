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
      const imports: ts.StringLiteral[] = (sf as any).imports || [];
      imports.forEach(item => {
        const result = matcher(item.text, undefined, undefined, ['.ts', '.js']);
        if (!result) {
          return;
        }
        let resolvedPath = relative(dirname(sf.fileName), result) || './';
        resolvedPath =
          resolvedPath[0] === '.' ? resolvedPath : './' + resolvedPath;
        item.text = resolvedPath;
      });
      return sf;
    };
  };
}
