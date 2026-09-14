/**
 * Minimal view of the programmatic API that TypeScript 7.1+ exposes through
 * the `typescript/unstable/sync` entry point (the Go-native compiler,
 * see https://github.com/microsoft/typescript-go).
 *
 * The CLI itself is compiled against TypeScript 6, whose package does not ship
 * these declarations, so only the members the CLI actually calls are described
 * here. Everything is resolved at runtime from the project's own `typescript`
 * installation; nothing in this file is imported from the package.
 */
export interface NativeDiagnostic {
  code?: number;
  /** `DiagnosticCategory`: 0 = Warning, 1 = Error, 2 = Suggestion, 3 = Message. */
  category?: number;
}

export interface NativeFormatDiagnosticsHost {
  getCurrentDirectory(): string;
  getCanonicalFileName(fileName: string): string;
  getNewLine(): string;
}

export interface NativeCompilerOptions {
  outDir?: string;
  rootDir?: string;
  paths?: Record<string, string[]>;
  declaration?: boolean;
  composite?: boolean;
  configFilePath?: string;
  [option: string]: unknown;
}

export interface NativeProjectReference {
  path: string;
  originalPath?: string;
  circular?: boolean;
}

export interface NativeParsedCommandLine {
  options: NativeCompilerOptions;
  fileNames: string[];
  projectReferences?: NativeProjectReference[];
  errors: NativeDiagnostic[];
  raw?: Record<string, unknown>;
}

export interface NativeCreateProgramOptions {
  compilerOptions: NativeCompilerOptions;
  projectReferences?: NativeProjectReference[];
  configFileParsingDiagnostics?: readonly NativeDiagnostic[];
}

export interface NativeEmitResult {
  emitSkipped: boolean;
  diagnostics: readonly NativeDiagnostic[];
  emittedFiles: readonly string[];
}

export interface NativeProgram extends NativeFormatDiagnosticsHost {
  getCompilerOptions(): NativeCompilerOptions;
  getSourceFileNames(): readonly string[];
  /** Union of the config file parsing and program (options) diagnostics. */
  getGlobalDiagnostics(): readonly NativeDiagnostic[];
  getSyntacticDiagnostics(): readonly NativeDiagnostic[];
  getBindDiagnostics(): readonly NativeDiagnostic[];
  getSemanticDiagnostics(): readonly NativeDiagnostic[];
  getDeclarationDiagnostics(): readonly NativeDiagnostic[];
  emit(): NativeEmitResult;
  dispose(): void;
}

export interface NativeApi extends NativeFormatDiagnosticsHost {
  parseConfigFile(file: string): NativeParsedCommandLine;
  createProgram(
    rootFiles: readonly string[],
    options: NativeCreateProgramOptions,
  ): NativeProgram;
  close(): void;
}

export interface NativeApiOptions {
  cwd?: string;
}

export interface NativeTypeScriptModule {
  API: new (options?: NativeApiOptions) => NativeApi;
  DiagnosticCategory: { Warning: number; Error: number };
  formatDiagnostics(
    diagnostics: readonly NativeDiagnostic[],
    host: NativeFormatDiagnosticsHost,
  ): string;
  formatDiagnosticsWithColorAndContext(
    diagnostics: readonly NativeDiagnostic[],
    host: NativeFormatDiagnosticsHost,
  ): string;
}
