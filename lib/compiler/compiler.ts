import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { BaseCompiler } from './base-compiler';
import { TsConfigProvider } from './helpers/tsconfig-provider';
import { tsconfigPathsBeforeHookFactory } from './hooks/tsconfig-paths.hook';
import { PluginsLoader } from './plugins/plugins-loader';
import { TypeScriptBinaryLoader } from './typescript-loader';

export class Compiler extends BaseCompiler {
  constructor(
    pluginsLoader: PluginsLoader,
    private readonly tsConfigProvider: TsConfigProvider,
    private readonly typescriptLoader: TypeScriptBinaryLoader,
  ) {
    super(pluginsLoader);
  }

  public run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string,
    _extras: any,
    onSuccess?: () => void,
  ) {
    const tsBinary = this.typescriptLoader.load();
    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: tsBinary.sys.getCurrentDirectory,
      getNewLine: () => tsBinary.sys.newLine,
    };

    const { options, fileNames, projectReferences } =
      this.tsConfigProvider.getByConfigFilename(tsConfigPath);

    const createProgram =
      tsBinary.createIncrementalProgram || tsBinary.createProgram;
    const program = createProgram.call(ts, {
      rootNames: fileNames,
      projectReferences,
      options,
    });

    const plugins = this.loadPlugins(configuration, tsConfigPath, appName);
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
        before: tsconfigPathsPlugin
          ? before.concat(tsconfigPathsPlugin)
          : before,
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
