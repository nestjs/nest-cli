import * as ts from 'typescript';
import {
  DeepPluginMeta,
  ReadonlyVisitor,
} from '../interfaces/readonly-visitor.interface';
import { FOUND_NO_ISSUES_GENERATING_METADATA } from '../swc/constants';
import { TypeCheckerHost } from '../swc/type-checker-host';
import { TypeScriptBinaryLoader } from '../typescript-loader';
import { PluginMetadataPrinter } from './plugin-metadata-printer';

export interface PluginMetadataGenerateOptions {
  /**
   * The visitors to use to generate the metadata.
   */
  visitors: ReadonlyVisitor[];
  /**
   * The output directory to write the metadata to.
   */
  outputDir: string;
  /**
   * Whether to watch the project for changes.
   */
  watch?: boolean;
  /**
   * The path to the tsconfig file.
   * Relative to the current working directory (process.cwd()).
   */
  tsconfigPath?: string;
  /**
   * The filename to write the metadata to.
   */
  filename?: string;
  /**
   * A reference to an existing ts.Program instance.
   */
  tsProgramRef?: ts.Program;
  /**
   * Whether to print diagnostics to the console.
   * @default true
   */
  printDiagnostics?: boolean;
}

/**
 * Generates plugins metadata by traversing the AST of the project.
 * @example
 * ```ts
 * const generator = new PluginMetadataGenerator();
 * generator.generate({
 *  visitors: [
 *    new ReadonlyVisitor({ introspectComments: true, pathToSource: __dirname }),
 *  ],
 *  outputDir: __dirname,
 *  watch: true,
 *  tsconfigPath: 'tsconfig.build.json',
 * });
 * ```
 */
export class PluginMetadataGenerator {
  private readonly pluginMetadataPrinter = new PluginMetadataPrinter();
  private readonly typeCheckerHost = new TypeCheckerHost();
  private readonly typescriptLoader = new TypeScriptBinaryLoader();
  private readonly tsBinary: typeof ts;

  constructor() {
    this.tsBinary = this.typescriptLoader.load();
  }

  generate(options: PluginMetadataGenerateOptions) {
    const {
      tsconfigPath,
      visitors,
      tsProgramRef,
      outputDir,
      watch,
      filename,
      printDiagnostics = true,
    } = options;

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

    const onTypeCheckOrProgramInit = (program: ts.Program) => {
      this.traverseAndPrintMetadata(program, visitors, outputDir, filename);

      if (printDiagnostics) {
        const tsBinary = this.typescriptLoader.load();
        const diagnostics = tsBinary.getPreEmitDiagnostics(program);
        if (diagnostics.length > 0) {
          const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
            getCanonicalFileName: (path) => path,
            getCurrentDirectory: tsBinary.sys.getCurrentDirectory,
            getNewLine: () => tsBinary.sys.newLine,
          };

          console.log();
          console.log(
            tsBinary.formatDiagnosticsWithColorAndContext(
              diagnostics,
              formatDiagnosticsHost,
            ),
          );
        } else {
          console.log(FOUND_NO_ISSUES_GENERATING_METADATA);
        }
      }
    };
    this.typeCheckerHost.run(tsconfigPath, {
      watch,
      onTypeCheck: onTypeCheckOrProgramInit,
      onProgramInit: onTypeCheckOrProgramInit,
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

    let typeImports: Record<string, string> = {};
    const collectedMetadata: Record<
      string,
      Record<string, Array<[ts.CallExpression, DeepPluginMeta]>>
    > = {};

    visitors.forEach((visitor) => {
      collectedMetadata[visitor.key] = visitor.collect() as Record<
        string,
        Array<[ts.CallExpression, DeepPluginMeta]>
      >;
      typeImports = {
        ...typeImports,
        ...visitor.typeImports,
      };
    });
    this.pluginMetadataPrinter.print(
      collectedMetadata,
      typeImports,
      {
        outputDir,
        filename,
      },
      this.tsBinary,
    );
  }
}
