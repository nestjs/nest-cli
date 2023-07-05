import * as ts from 'typescript';

export type DeepPluginMeta =
  | ts.ObjectLiteralExpression
  | {
      [key: string]: DeepPluginMeta;
    };

export interface ReadonlyVisitor {
  key: string;
  typeImports: Record<string, string>;

  // Using unknown here because of the potential
  // incompatibility between a locally installed TypeScript version
  // and the one used by the CLI.

  visit(program: unknown, sf: unknown): unknown;
  collect(): Record<string, Array<unknown>>;
}
