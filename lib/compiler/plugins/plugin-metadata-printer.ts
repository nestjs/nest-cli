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
    tsBinary: typeof ts,
  ) {
    const objectLiteralExpr = tsBinary.factory.createObjectLiteralExpression(
      Object.keys(metadata).map((key) =>
        this.recursivelyCreatePropertyAssignment(
          key,
          metadata[key] as unknown as Array<
            [ts.CallExpression, DeepPluginMeta]
          >,
          tsBinary,
        ),
      ),
    );

    const exportAssignment = tsBinary.factory.createExportAssignment(
      undefined,
      undefined,
      tsBinary.factory.createArrowFunction(
        [tsBinary.factory.createToken(tsBinary.SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        tsBinary.factory.createToken(
          tsBinary.SyntaxKind.EqualsGreaterThanToken,
        ),
        tsBinary.factory.createBlock(
          [
            this.createTypeImportVariableStatement(typeImports, tsBinary),
            tsBinary.factory.createReturnStatement(objectLiteralExpr),
          ],
          true,
        ),
      ),
    );

    const printer = tsBinary.createPrinter({
      newLine: tsBinary.NewLineKind.LineFeed,
    });
    const resultFile = tsBinary.createSourceFile(
      'file.ts',
      '',
      tsBinary.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      tsBinary.ScriptKind.TS,
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
          tsBinary.EmitHint.Unspecified,
          exportAssignment,
          resultFile,
        ),
    );
  }

  private recursivelyCreatePropertyAssignment(
    identifier: string,
    meta: DeepPluginMeta | Array<[ts.CallExpression, DeepPluginMeta]>,
    tsBinary: typeof ts,
  ): ts.PropertyAssignment {
    if (Array.isArray(meta)) {
      return tsBinary.factory.createPropertyAssignment(
        tsBinary.factory.createStringLiteral(identifier),
        tsBinary.factory.createArrayLiteralExpression(
          meta.map(([importExpr, meta]) =>
            tsBinary.factory.createArrayLiteralExpression([
              importExpr,
              tsBinary.factory.createObjectLiteralExpression(
                Object.keys(meta).map((key) =>
                  this.recursivelyCreatePropertyAssignment(
                    key,
                    (
                      meta as {
                        [key: string]: DeepPluginMeta;
                      }
                    )[key],
                    tsBinary,
                  ),
                ),
              ),
            ]),
          ),
        ),
      );
    }
    return tsBinary.factory.createPropertyAssignment(
      tsBinary.factory.createStringLiteral(identifier),
      tsBinary.isObjectLiteralExpression(meta as unknown as ts.Node)
        ? (meta as ts.ObjectLiteralExpression)
        : tsBinary.factory.createObjectLiteralExpression(
            Object.keys(meta).map((key) =>
              this.recursivelyCreatePropertyAssignment(
                key,
                (
                  meta as {
                    [key: string]: DeepPluginMeta;
                  }
                )[key],
                tsBinary,
              ),
            ),
          ),
    );
  }

  private createTypeImportVariableStatement(
    typeImports: Record<string, string>,
    tsBinary: typeof ts,
  ): ts.Statement {
    return tsBinary.factory.createVariableStatement(
      undefined,
      tsBinary.factory.createVariableDeclarationList(
        [
          tsBinary.factory.createVariableDeclaration(
            tsBinary.factory.createIdentifier(TYPE_IMPORT_VARIABLE_NAME),
            undefined,
            undefined,
            tsBinary.factory.createObjectLiteralExpression(
              Object.keys(typeImports).map((ti) =>
                this.createPropertyAssignment(ti, typeImports[ti], tsBinary),
              ),
              true,
            ),
          ),
        ],
        tsBinary.NodeFlags.Const |
          tsBinary.NodeFlags.AwaitContext |
          tsBinary.NodeFlags.ContextFlags |
          tsBinary.NodeFlags.TypeExcludesFlags,
      ),
    );
  }

  private createPropertyAssignment(
    identifier: string,
    target: string,
    tsBinary: typeof ts,
  ) {
    return tsBinary.factory.createPropertyAssignment(
      tsBinary.factory.createComputedPropertyName(
        tsBinary.factory.createStringLiteral(identifier),
      ),
      tsBinary.factory.createIdentifier(target),
    );
  }
}
