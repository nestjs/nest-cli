import * as ts from 'typescript';
import {
  DeepPluginMeta,
  ReadonlyVisitor,
} from '../interfaces/readonly-visitor.interface.js';
import { FOUND_NO_ISSUES_GENERATING_METADATA } from '../swc/constants.js';
import { TypeCheckerHost } from '../swc/type-checker-host.js';
import { TypeScriptBinaryLoader } from '../typescript-loader.js';
import { PluginMetadataPrinter } from './plugin-metadata-printer.js';

/**
 * Returns `true` when the consuming project uses an ESM-style module
 * resolution strategy (`node16` / `nodenext`). Under those resolution
 * modes, dynamic `import()` specifiers MUST include the file extension
 * (typically `.js`) for the runtime resolver to find the module. Without
 * the extension, executing the generated metadata file fails with
 * `ERR_MODULE_NOT_FOUND`, and TypeScript reports a diagnostic.
 */
export function requiresExplicitImportExtensions(
  options: ts.CompilerOptions,
  tsBinary: typeof ts,
): boolean {
  const moduleResolution = options.moduleResolution;
  return (
    moduleResolution === tsBinary.ModuleResolutionKind.Node16 ||
    moduleResolution === tsBinary.ModuleResolutionKind.NodeNext
  );
}

const RELATIVE_PATH_RE = /^\.\.?\//;
// Any common JS/TS-style extension that the user could have authored or
// that our rewrite would have already produced. Prevents double-appending.
const HAS_KNOWN_EXTENSION_RE = /\.(m?js|c?js|m?ts|c?ts|json|node)$/i;

/**
 * Returns the same import path with `.js` appended when (and only when)
 * the path is relative and does not already end in a recognized
 * extension. Bare specifiers (e.g. `@nestjs/common`) and absolute paths
 * are returned unchanged because the caller's resolver handles them.
 */
export function appendJsExtensionIfMissing(importPath: string): string {
  if (!RELATIVE_PATH_RE.test(importPath)) {
    return importPath;
  }
  if (HAS_KNOWN_EXTENSION_RE.test(importPath)) {
    return importPath;
  }
  return `${importPath}.js`;
}

/**
 * Rewrites a single `await import("...")`-style string by appending the
 * `.js` extension to the inner specifier when it is a relative path
 * without an extension. Used to patch the visitor-supplied `typeImports`
 * map values.
 */
export function rewriteAsyncImportString(target: string): string {
  return target.replace(
    /import\((['"])((?:\\\1|(?!\1).)*)\1\)/g,
    (match, quote, specifier) =>
      `import(${quote}${appendJsExtensionIfMissing(specifier)}${quote})`,
  );
}

/**
 * Walks the given `ts.CallExpression` tree and rewrites every dynamic
 * `import("...")` whose specifier is a relative path missing an
 * extension. Returns a new node when changes are required, or the input
 * node unchanged otherwise.
 */
export function rewriteImportExpressionForNodeNext(
  expression: ts.CallExpression,
  tsBinary: typeof ts,
): ts.CallExpression {
  const visit = (node: ts.Node): ts.Node => {
    if (
      tsBinary.isCallExpression(node) &&
      node.expression.kind === tsBinary.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      tsBinary.isStringLiteralLike(node.arguments[0])
    ) {
      const original = (node.arguments[0] as ts.StringLiteralLike).text;
      const rewritten = appendJsExtensionIfMissing(original);
      if (rewritten !== original) {
        const updatedArgs = [
          tsBinary.factory.createStringLiteral(rewritten),
          ...node.arguments.slice(1),
        ];
        return tsBinary.factory.updateCallExpression(
          node,
          node.expression,
          node.typeArguments,
          updatedArgs,
        );
      }
    }
    return tsBinary.visitEachChild(node, visit, undefined as any);
  };
  return visit(expression) as ts.CallExpression;
}

/**
 * Recursively walks the collected plugin metadata, rewriting every
 * dynamic `import("./relative")` call expression to include the `.js`
 * extension required by node16 / nodenext module resolution.
 */
export function rewriteCollectedMetadataForNodeNext(
  metadata: Record<
    string,
    Record<string, Array<[ts.CallExpression, DeepPluginMeta]>>
  >,
  tsBinary: typeof ts,
): void {
  for (const visitorKey of Object.keys(metadata)) {
    const sections = metadata[visitorKey];
    for (const sectionKey of Object.keys(sections)) {
      const tuples = sections[sectionKey];
      if (!Array.isArray(tuples)) {
        continue;
      }
      for (let i = 0; i < tuples.length; i++) {
        const [importExpr, meta] = tuples[i];
        tuples[i] = [
          rewriteImportExpressionForNodeNext(importExpr, tsBinary),
          meta,
        ];
      }
    }
  }
}

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

    // Under `node16` / `nodenext` module resolution, dynamic `import()`
    // specifiers must include explicit file extensions. The visitors emit
    // bare relative specifiers (e.g. `import("./hello.dto")`), which are
    // valid under classic / node10 resolution but break compilation and
    // runtime under nodenext. When the consuming project uses an ESM-style
    // resolver, rewrite both the metadata import call expressions and the
    // typeImports map values to include the `.js` extension. See #3364.
    if (
      requiresExplicitImportExtensions(
        programRef.getCompilerOptions(),
        this.tsBinary,
      )
    ) {
      rewriteCollectedMetadataForNodeNext(collectedMetadata, this.tsBinary);
      for (const key of Object.keys(typeImports)) {
        typeImports[key] = rewriteAsyncImportString(typeImports[key]);
      }
    }

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
