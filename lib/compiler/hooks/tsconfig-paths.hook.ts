import { dirname, join, relative } from 'path';
import * as pathToRegexp from 'path-to-regexp';
import * as ts from 'typescript';

export function tsconfigPathsBeforeHookFactory(
  compilerOptions: ts.CompilerOptions,
) {
  const { paths = {}, baseUrl } = compilerOptions;
  const pathsToInspect = Object.keys(paths).map(path => ({
    matcher: pathToRegexp(path),
    originalPath: path,
  }));

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    const head = (arr: [string]): string => arr && arr[0];
    return (sf: ts.SourceFile) => {
      const imports: ts.StringLiteral[] = (sf as any).imports || [];
      imports.forEach(item => {
        const result = pathsToInspect.find(({ matcher }) =>
          matcher.test(item.text),
        );
        if (!result) {
          return;
        }
        const resolvedPath =
          relative(
            dirname(sf.fileName),
            join(baseUrl!, head(paths[result.originalPath] as [string])),
          ) || './';
        item.text = item.text.replace(result.matcher, resolvedPath);
      });
      return sf;
    };
  };
}
