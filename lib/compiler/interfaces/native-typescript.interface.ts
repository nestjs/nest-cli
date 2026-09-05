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
export type NativeDiagnostic = unknown;

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
  preserveWatchOutput?: boolean;
  allowJs?: boolean;
  resolveJsonModule?: boolean;
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

export interface NativeFileChanges {
  invalidateAll?: boolean;
  changed?: string[];
  created?: string[];
  deleted?: string[];
}

export interface NativeEmitResult {
  emitSkipped: boolean;
  diagnostics: readonly NativeDiagnostic[];
  emittedFiles: readonly string[];
}

export interface NativeProgram extends NativeFormatDiagnosticsHost {
  getCompilerOptions(): NativeCompilerOptions;
  getSourceFileNames(): readonly string[];
  getConfigFileParsingDiagnostics(): readonly NativeDiagnostic[];
  getProgramDiagnostics(): readonly NativeDiagnostic[];
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
    oldProgram?: NativeProgram,
    fileChanges?: NativeFileChanges,
  ): NativeProgram;
  close(): void;
}

export interface NativeApiOptions {
  cwd?: string;
}

export interface NativeTypeScriptModule {
  API: new (options?: NativeApiOptions) => NativeApi;
  formatDiagnostics(
    diagnostics: readonly NativeDiagnostic[],
    host: NativeFormatDiagnosticsHost,
  ): string;
  formatDiagnosticsWithColorAndContext(
    diagnostics: readonly NativeDiagnostic[],
    host: NativeFormatDiagnosticsHost,
  ): string;
}
