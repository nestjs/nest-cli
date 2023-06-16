import { writeFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { DeepPluginMeta } from '../interfaces/readonly-visitor.interface';

const SERIALIZED_METADATA_FILENAME = 'metadata.ts';
const TYPE_IMPORT_VARIABLE_NAME = 't';

export interface PluginMetadataPrintOptions {
  outputDir: string;
  filename?: string;
}

type ComposedPluginMeta = Record<
  string,
  Record<string, Array<[ts.CallExpression, DeepPluginMeta]>>
>;

/**
 * Prints the metadata to a file.
 */
export class PluginMetadataPrinter {
  print(
    metadata: ComposedPluginMeta,
    typeImports: Record<string, string>,
    options: PluginMetadataPrintOptions,
  ) {
    const objectLiteralExpr = ts.factory.createObjectLiteralExpression(
      Object.keys(metadata).map((key) =>
        this.recursivelyCreatePropertyAssignment(
          key,
          metadata[key] as unknown as Array<
            [ts.CallExpression, DeepPluginMeta]
          >,
        ),
      ),
    );

    const exportAssignment = ts.factory.createExportAssignment(
      undefined,
      undefined,
      ts.factory.createArrowFunction(
        [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock(
          [
            this.createTypeImportVariableStatement(typeImports),
            ts.factory.createReturnStatement(objectLiteralExpr),
          ],
          true,
        ),
      ),
    );

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
    });
    const resultFile = ts.createSourceFile(
      'file.ts',
      '',
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      ts.ScriptKind.TS,
    );

    const filename = join(
      options.outputDir!,
      options.filename ?? SERIALIZED_METADATA_FILENAME,
    );
    const eslintPrefix = `/* eslint-disable */\n`;
    writeFileSync(
      filename,
      eslintPrefix +
        printer.printNode(
          ts.EmitHint.Unspecified,
          exportAssignment,
          resultFile,
        ),
    );
  }

  private recursivelyCreatePropertyAssignment(
    identifier: string,
    meta: DeepPluginMeta | Array<[ts.CallExpression, DeepPluginMeta]>,
  ): ts.PropertyAssignment {
    if (Array.isArray(meta)) {
      return ts.factory.createPropertyAssignment(
        ts.factory.createStringLiteral(identifier),
        ts.factory.createArrayLiteralExpression(
          meta.map(([importExpr, meta]) =>
            ts.factory.createArrayLiteralExpression([
              importExpr,
              ts.factory.createObjectLiteralExpression(
                Object.keys(meta).map((key) =>
                  this.recursivelyCreatePropertyAssignment(
                    key,
                    (
                      meta as {
                        [key: string]: DeepPluginMeta;
                      }
                    )[key],
                  ),
                ),
              ),
            ]),
          ),
        ),
      );
    }
    return ts.factory.createPropertyAssignment(
      ts.factory.createStringLiteral(identifier),
      ts.isObjectLiteralExpression(meta as unknown as ts.Node)
        ? (meta as ts.ObjectLiteralExpression)
        : ts.factory.createObjectLiteralExpression(
            Object.keys(meta).map((key) =>
              this.recursivelyCreatePropertyAssignment(
                key,
                (
                  meta as {
                    [key: string]: DeepPluginMeta;
                  }
                )[key],
              ),
            ),
          ),
    );
  }

  private createTypeImportVariableStatement(
    typeImports: Record<string, string>,
  ): ts.Statement {
    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier(TYPE_IMPORT_VARIABLE_NAME),
            undefined,
            undefined,
            ts.factory.createObjectLiteralExpression(
              Object.keys(typeImports).map((ti) =>
                this.createPropertyAssignment(ti, typeImports[ti]),
              ),
              true,
            ),
          ),
        ],
        ts.NodeFlags.Const |
          ts.NodeFlags.AwaitContext |
          ts.NodeFlags.ContextFlags |
          ts.NodeFlags.TypeExcludesFlags,
      ),
    );
  }

  private createPropertyAssignment(identifier: string, target: string) {
    return ts.factory.createPropertyAssignment(
      ts.factory.createComputedPropertyName(
        ts.factory.createStringLiteral(identifier),
      ),
      ts.factory.createIdentifier(target),
    );
  }
}
