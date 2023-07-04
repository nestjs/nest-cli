import * as ts from 'typescript';

export type DeepPluginMeta =
  | ts.ObjectLiteralExpression
  | {
      [key: string]: DeepPluginMeta;
    };

export interface ReadonlyVisitor {
  key: string;
  typeImports: Record<string, string>;
  visit<Program = ts.Program, SourceFile = ts.SourceFile>(
    program: Program,
    sf: SourceFile,
  ): void;
  collect<MetaTuple = [ts.CallExpression, DeepPluginMeta]>(): Record<
    string,
    Array<MetaTuple>
  >;
}
