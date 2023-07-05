import * as ts from 'typescript';

export type DeepPluginMeta =
  | ts.ObjectLiteralExpression
  | {
      [key: string]: DeepPluginMeta;
    };

export interface ReadonlyVisitor {
  key: string;
  typeImports: Record<string, string>;
  visit<Program = any, SourceFile = any>(
    program: Program,
    sf: SourceFile,
  ): void;
  collect<MetaTuple = any>(): Record<string, Array<MetaTuple>>;
}
