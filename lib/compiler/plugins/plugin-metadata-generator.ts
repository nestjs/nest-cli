import * as ts from 'typescript';
import {
  DeepPluginMeta,
  ReadonlyVisitor,
} from '../interfaces/readonly-visitor.interface';
import { TypeCheckerHost } from '../swc/type-checker-host';
import { PluginMetadataPrinter } from './plugin-metadata-printer';

export interface PluginMetadataGenerateOptions {
  visitors: ReadonlyVisitor[];
  outputDir: string;
  watch?: boolean;
  tsconfigPath?: string;
  filename?: string;
  tsProgramRef?: ts.Program;
}

export class PluginMetadataGenerator {
  private readonly pluginMetadataPrinter = new PluginMetadataPrinter();
  private readonly typeCheckerHost = new TypeCheckerHost();

  generate(options: PluginMetadataGenerateOptions) {
    const { tsconfigPath, visitors, tsProgramRef, outputDir, watch, filename } =
      options;

    if (visitors.length === 0) {
      return;
    }

    if (tsProgramRef) {
      return this.traverseAndPrintMetadata(
        tsProgramRef,
        visitors,
        outputDir,
        filename,
      );
    }

    this.typeCheckerHost.run(tsconfigPath, {
      watch,
      onSuccess: (program) => {
        this.traverseAndPrintMetadata(program, visitors, outputDir, filename);
      },
    });
  }

  private traverseAndPrintMetadata(
    programRef: ts.Program,
    visitors: Array<ReadonlyVisitor>,
    outputDir: string,
    filename?: string,
  ) {
    for (const sourceFile of programRef.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        visitors.forEach((visitor) => visitor.visit(programRef, sourceFile));
      }
    }

    const collectedMetadata: Record<
      string,
      Array<[ts.CallExpression, DeepPluginMeta]>
    > = {};
    visitors.forEach((visitor) => {
      collectedMetadata[visitor.key] = visitor.collect();
    });
    this.pluginMetadataPrinter.print(collectedMetadata, {
      outputDir,
      filename,
    });
  }
}
