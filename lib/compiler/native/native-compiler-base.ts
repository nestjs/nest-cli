import { Configuration } from '../../configuration/index.js';
import { CLI_ERRORS } from '../../ui/index.js';
import { BaseCompiler } from '../base-compiler.js';
import { getValueOrDefault } from '../helpers/get-value-or-default.js';
import { TsConfigProvider } from '../helpers/tsconfig-provider.js';
import {
  NativeCompilerOptions,
  NativeDiagnostic,
  NativeProgram,
} from '../interfaces/native-typescript.interface.js';
import { PluginsLoader } from '../plugins/plugins-loader.js';
import { TypeScriptBinaryLoader } from '../typescript-loader.js';

/**
 * Shared pieces of the `tsc` builder when it runs on the native TypeScript
 * compiler (TypeScript 7.1+, `typescript/unstable/sync`).
 *
 * The native API emits straight from Go and does not accept custom
 * transformers, so neither Nest compiler plugins (`@nestjs/swagger`,
 * `@nestjs/graphql`, ...) nor the built-in `paths` rewriting hook can run
 * here. Both are rejected up front with an actionable error rather than
 * producing output that fails at runtime.
 */
export abstract class NativeCompilerBase<
  T = Record<string, any>,
> extends BaseCompiler<T> {
  constructor(
    pluginsLoader: PluginsLoader,
    protected readonly tsConfigProvider: TsConfigProvider,
    protected readonly typescriptLoader: TypeScriptBinaryLoader,
  ) {
    super(pluginsLoader);
  }

  protected assertNoPluginsConfigured(
    configuration: Required<Configuration>,
    appName: string | undefined,
  ) {
    const plugins = getValueOrDefault<Array<string | { name: string }>>(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    if (!Array.isArray(plugins) || plugins.length === 0) {
      return;
    }
    const names = plugins.map((entry) =>
      typeof entry === 'object' ? entry.name : String(entry),
    );
    throw new Error(CLI_ERRORS.PLUGINS_UNSUPPORTED_ON_NATIVE_TYPESCRIPT(names));
  }

  protected assertNoPathsConfigured(options: NativeCompilerOptions) {
    const aliases = Object.keys(options.paths ?? {});
    if (aliases.length === 0) {
      return;
    }
    throw new Error(CLI_ERRORS.PATHS_UNSUPPORTED_ON_NATIVE_TYPESCRIPT(aliases));
  }

  /**
   * Emits the program, then reports every diagnostic the classic
   * `getPreEmitDiagnostics` would (global covers config parsing and options;
   * declaration only when declarations are emitted) plus the emit ones.
   * Returns the number of errors; warnings are printed but do not count.
   */
  protected emitAndReport(
    program: NativeProgram,
    options: NativeCompilerOptions,
  ): number {
    const nativeTs = this.typescriptLoader.getNativeModule();
    const emitResult = program.emit();
    const diagnostics: NativeDiagnostic[] = [
      ...program.getGlobalDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getBindDiagnostics(),
      ...program.getSemanticDiagnostics(),
      ...(options.declaration || options.composite
        ? program.getDeclarationDiagnostics()
        : []),
      ...emitResult.diagnostics,
    ];
    if (diagnostics.length > 0) {
      console.error(
        nativeTs.formatDiagnosticsWithColorAndContext(diagnostics, program),
      );
    }
    const errorsCount = diagnostics.filter(
      (diagnostic) => diagnostic.category === nativeTs.DiagnosticCategory.Error,
    ).length;
    if (errorsCount > 0) {
      console.info(`Found ${errorsCount} error(s).` + program.getNewLine());
    }
    return errorsCount;
  }
}
