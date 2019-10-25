import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { TsConfigProvider } from './helpers/tsconfig-provider';
import { tsconfigPathsBeforeHookFactory } from './hooks/tsconfig-paths.hook';
import { PluginsLoader } from './plugins-loader';

export class Compiler {
  private readonly formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };

  constructor(
    private readonly pluginsLoader: PluginsLoader,
    private readonly tsConfigProvider: TsConfigProvider,
  ) {}

  public run(
    configuration: Required<Configuration>,
    configFilename: string,
    appName: string,
    onSuccess?: () => void,
  ) {
    const {
      options,
      fileNames,
      projectReferences,
    } = this.tsConfigProvider.getByConfigFilename(configFilename);
    const program = ts.createIncrementalProgram({
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
    const before = plugins.beforeHooks.map(hook => hook(program as any));
    const after = plugins.afterHooks.map(hook => hook(program as any));
    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        before: before.concat(tsconfigPathsPlugin),
        after,
        afterDeclarations: [],
      },
    );
    this.reportAfterCompilationDiagnostic(program, emitResult);

    const errorsCount = this.reportAfterCompilationDiagnostic(
      program,
      emitResult,
    );
    if (errorsCount && !onSuccess) {
      process.exit(1);
    } else if (!errorsCount && onSuccess) {
      onSuccess();
    }
  }

  private reportAfterCompilationDiagnostic(
    program: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    emitResult: ts.EmitResult,
  ): number {
    const diagnostics = ts
      .getPreEmitDiagnostics((program as unknown) as ts.Program)
      .concat(emitResult.diagnostics);
    console.error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, this.formatHost),
    );
    if (diagnostics.length > 0) {
      console.info(`Found ${diagnostics.length} error(s).` + ts.sys.newLine);
    }
    return diagnostics.length;
  }
}
