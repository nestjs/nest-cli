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
    const { options, fileNames } = this.tsConfigProvider.getByConfigFilename(
      configFilename,
    );
    const program = ts.createProgram({
      rootNames: fileNames,
      options,
    });

    const pluginsConfig = getValueOrDefault(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    const plugins = this.pluginsLoader.load(pluginsConfig);
    const tsconfigPathsPlugin = tsconfigPathsBeforeHookFactory(options);
    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        before: plugins.beforeHooks.concat(tsconfigPathsPlugin),
        after: plugins.afterHooks,
        afterDeclarations: [],
      },
    );
    this.reportAfterCompilationDiagnostic(program, emitResult);

    const exitCode = emitResult.emitSkipped ? 1 : 0;
    if (exitCode) {
      console.log(`Process exiting with code '${exitCode}'.`);
      process.exit(exitCode);
    } else {
      onSuccess && onSuccess();
    }
  }

  private reportAfterCompilationDiagnostic(
    program: ts.Program,
    emitResult: ts.EmitResult,
  ) {
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);
    console.error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, this.formatHost),
    );
    if (diagnostics.length > 0) {
      console.info(`Found ${diagnostics.length} error(s).` + ts.sys.newLine);
    }
  }
}
