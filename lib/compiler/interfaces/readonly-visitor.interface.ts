import * as ts from 'typescript';

export type DeepPluginMeta =
  | ts.ObjectLiteralExpression
  | {
      [key: string]: DeepPluginMeta;
    };

export interface ReadonlyVisitor {
  key: string;
  typeImports: Record<string, string>;
  visit(program: ts.Program, sf: ts.SourceFile): void;
  collect(): Record<string, Array<[ts.CallExpression, DeepPluginMeta]>>;
}
