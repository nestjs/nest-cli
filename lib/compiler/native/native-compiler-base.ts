import { yellow } from 'ansis';
import { Configuration } from '../../configuration/index.js';
import { CLI_ERRORS, INFO_PREFIX } from '../../ui/index.js';
import { BaseCompiler } from '../base-compiler.js';
import { getValueOrDefault } from '../helpers/get-value-or-default.js';
import { TsConfigProvider } from '../helpers/tsconfig-provider.js';
import {
  NativeCompilerOptions,
  NativeDiagnostic,
  NativeProgram,
  NativeTypeScriptModule,
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
 * here. Plugins are rejected up front with an actionable error; `paths` only
 * produce a warning since the emitted code still works when the runtime
 * resolves the aliases (e.g. through `tsconfig-paths` or a bundler).
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

  protected loadNativeTypeScript(): NativeTypeScriptModule {
    const nativeModule = this.typescriptLoader.loadNativeModule();
    if (!nativeModule) {
      throw new Error(CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION('unknown'));
    }
    return nativeModule;
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

  protected warnIfPathsConfigured(options: NativeCompilerOptions) {
    const paths = options.paths;
    if (!paths || Object.keys(paths).length === 0) {
      return;
    }
    console.warn(
      INFO_PREFIX +
        yellow(
          ` "compilerOptions.paths" aliases are not rewritten in the emitted output when compiling with the native TypeScript compiler (TypeScript 7). Make sure the aliases are resolved at runtime, or install TypeScript 6 to keep the previous behavior.`,
        ),
    );
  }

  /**
   * Mirrors `ts.getPreEmitDiagnostics` (config, options, syntactic, global,
   * semantic, declaration) on top of the native program.
   */
  protected collectDiagnostics(
    program: NativeProgram,
    options: NativeCompilerOptions,
  ): NativeDiagnostic[] {
    const diagnostics: NativeDiagnostic[] = [
      ...program.getConfigFileParsingDiagnostics(),
      ...program.getProgramDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getBindDiagnostics(),
      ...program.getGlobalDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ];
    if (options.declaration || options.composite) {
      diagnostics.push(...program.getDeclarationDiagnostics());
    }
    return this.dedupeDiagnostics(diagnostics);
  }

  private dedupeDiagnostics(diagnostics: NativeDiagnostic[]) {
    const seen = new Set<string>();
    return diagnostics.filter((diagnostic) => {
      // Native diagnostics carry `fileName`/`pos`/`text`; the classic shape
      // (`file`/`start`/`messageText`) is tolerated so the helper stays
      // correct should the API converge on it.
      const { fileName, file, pos, start, code, text, messageText } =
        (diagnostic ?? {}) as Record<string, unknown>;
      const key = JSON.stringify([
        fileName ?? file,
        pos ?? start,
        code,
        text ?? messageText,
      ]);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
