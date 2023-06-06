import * as ts from 'typescript';

export type DeepPluginMeta =
  | ts.ObjectLiteralExpression
  | {
      [key: string]: DeepPluginMeta;
    };

export interface ReadonlyVisitor {
  key: string;
  visit(program: ts.Program, sf: ts.SourceFile): void;
  collect(): Array<[ts.CallExpression, DeepPluginMeta]>;
}
