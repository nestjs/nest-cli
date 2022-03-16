import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { TsConfigProvider } from './helpers/tsconfig-provider';
import { tsconfigPathsBeforeHookFactory } from './hooks/tsconfig-paths.hook';
import { PluginsLoader } from './plugins-loader';
import { TypeScriptBinaryLoader } from './typescript-loader';

export class Compiler {
  constructor(
    private readonly pluginsLoader: PluginsLoader,
    private readonly tsConfigProvider: TsConfigProvider,
    private readonly typescriptLoader: TypeScriptBinaryLoader,
  ) {}

  public run(
    configuration: Required<Configuration>,
    configFilename: string,
    appName: string,
    onSuccess?: () => void,
  ) {
    const tsBinary = this.typescriptLoader.load();
    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: tsBinary.sys.getCurrentDirectory,
      getNewLine: () => tsBinary.sys.newLine,
    };

    const { options, fileNames, projectReferences } =
      this.tsConfigProvider.getByConfigFilename(configFilename);

    const createProgram =
      tsBinary.createIncrementalProgram || tsBinary.createProgram;
    const program = createProgram.call(ts, {
      rootNames: fileNames,
      projectReferences,
      options,
    });

    const pluginsConfig = getValueOrDefault(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    const plugins = this.pluginsLoader.load(pluginsConfig);
    const tsconfigPathsPlugin = tsconfigPathsBeforeHookFactory(options);
    const programRef = program.getProgram
      ? program.getProgram()
      : (program as any as ts.Program);
    const before = plugins.beforeHooks.map((hook) => hook(programRef));
    const after = plugins.afterHooks.map((hook) => hook(programRef));
    const afterDeclarations = plugins.afterDeclarationsHooks.map((hook) =>
      hook(programRef),
    );
    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        before: before.concat(tsconfigPathsPlugin),
        after,
        afterDeclarations,
      },
    );

    const errorsCount = this.reportAfterCompilationDiagnostic(
      program as any,
      emitResult,
      tsBinary,
      formatHost,
    );
    if (errorsCount) {
      process.exit(1);
    } else if (!errorsCount && onSuccess) {
      onSuccess();
    }
  }

  private reportAfterCompilationDiagnostic(
    program: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    emitResult: ts.EmitResult,
    tsBinary: typeof ts,
    formatHost: ts.FormatDiagnosticsHost,
  ): number {
    const diagnostics = tsBinary
      .getPreEmitDiagnostics(program as unknown as ts.Program)
      .concat(emitResult.diagnostics);

    if (diagnostics.length > 0) {
      console.error(
        tsBinary.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
      );
      console.info(
        `Found ${diagnostics.length} error(s).` + tsBinary.sys.newLine,
      );
    }
    return diagnostics.length;
  }
}
