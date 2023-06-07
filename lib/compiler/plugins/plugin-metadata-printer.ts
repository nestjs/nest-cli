import { writeFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { DeepPluginMeta } from '../interfaces/readonly-visitor.interface';

const SERIALIZED_METADATA_FILENAME = 'metadata.ts';

export interface PluginMetadataPrintOptions {
  outputDir: string;
  filename?: string;
}

/**
 * Prints the metadata to a file.
 */
export class PluginMetadataPrinter {
  print(
    metadata: Record<
      string,
      Record<string, Array<[ts.CallExpression, DeepPluginMeta]>>
    >,
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
      objectLiteralExpr,
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
}
