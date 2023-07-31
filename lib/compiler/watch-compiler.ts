import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { CLI_ERRORS } from '../ui/errors';
import { BaseCompiler } from './base-compiler';
import { getValueOrDefault } from './helpers/get-value-or-default';
import {
  displayManualRestartTip,
  listenForManualRestart,
} from './helpers/manual-restart';
import { TsConfigProvider } from './helpers/tsconfig-provider';
import { tsconfigPathsBeforeHookFactory } from './hooks/tsconfig-paths.hook';
import {
  MultiNestCompilerPlugins,
  PluginsLoader,
} from './plugins/plugins-loader';
import { TypeScriptBinaryLoader } from './typescript-loader';

type TypescriptWatchCompilerExtras = {
  /**
   * If `undefined`, the value of 'preserveWatchOutput' option from tsconfig
   * file will be used instead.
   */
  preserveWatchOutput: boolean | undefined;
};

export class WatchCompiler extends BaseCompiler<TypescriptWatchCompilerExtras> {
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
    extras: TypescriptWatchCompilerExtras,
    onSuccess?: () => void,
  ) {
    const tsBin = this.typescriptLoader.load();
    const configPath = tsBin.findConfigFile(
      process.cwd(),
      tsBin.sys.fileExists,
      tsConfigPath,
    );
    if (!configPath) {
      throw new Error(CLI_ERRORS.MISSING_TYPESCRIPT(tsConfigPath));
    }
    const { options, projectReferences } =
      this.tsConfigProvider.getByConfigFilename(tsConfigPath);

    const createProgram = tsBin.createEmitAndSemanticDiagnosticsBuilderProgram;
    const origDiagnosticReporter = (tsBin as any).createDiagnosticReporter(
      tsBin.sys,
      true,
    );
    const origWatchStatusReporter = (tsBin as any).createWatchStatusReporter(
      tsBin.sys,
      true,
    );
    const host = tsBin.createWatchCompilerHost(
      configPath,
      {
        ...options,
        preserveWatchOutput:
          extras.preserveWatchOutput ?? options.preserveWatchOutput,
      },
      tsBin.sys,
      createProgram,
      this.createDiagnosticReporter(origDiagnosticReporter),
      this.createWatchStatusChanged(origWatchStatusReporter, onSuccess),
    );

    const manualRestart = getValueOrDefault(
      configuration,
      'compilerOptions.manualRestart',
      appName,
    );

    const plugins = this.loadPlugins(configuration, tsConfigPath, appName);
    this.overrideCreateProgramFn(
      host,
      manualRestart,
      projectReferences,
      plugins,
    );

    const watchProgram = tsBin.createWatchProgram(host);

    if (manualRestart) {
      listenForManualRestart(() => {
        watchProgram.close();
        this.run(configuration, tsConfigPath, appName, extras, onSuccess);
      });
    }
  }

  private overrideCreateProgramFn(
    host: ts.WatchCompilerHostOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>,
    manualRestart: any,
    projectReferences: readonly ts.ProjectReference[] | undefined,
    plugins: MultiNestCompilerPlugins,
  ) {
    const origCreateProgram = host.createProgram;
    (host as any).createProgram = (
      rootNames: ReadonlyArray<string>,
      options: ts.CompilerOptions | undefined,
      // tslint:disable-next-line:no-shadowed-variable
      host: ts.CompilerHost,
      oldProgram: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    ) => {
      if (manualRestart) {
        displayManualRestartTip();
      }

      const tsconfigPathsPlugin = options
        ? tsconfigPathsBeforeHookFactory(options)
        : null;
      const program = origCreateProgram(
        rootNames,
        options,
        host,
        oldProgram,
        undefined,
        projectReferences,
      );
      const origProgramEmit = program.emit;
      program.emit = (
        targetSourceFile?: ts.SourceFile,
        writeFile?: ts.WriteFileCallback,
        cancellationToken?: ts.CancellationToken,
        emitOnlyDtsFiles?: boolean,
        customTransformers?: ts.CustomTransformers,
      ) => {
        let transforms = customTransformers;
        transforms = typeof transforms !== 'object' ? {} : transforms;

        const before = plugins.beforeHooks.map((hook) =>
          hook(program.getProgram()),
        );
        const after = plugins.afterHooks.map((hook) =>
          hook(program.getProgram()),
        );
        const afterDeclarations = plugins.afterDeclarationsHooks.map((hook) =>
          hook(program.getProgram()),
        );
        if (tsconfigPathsPlugin) {
          before.unshift(tsconfigPathsPlugin);
        }

        transforms.before = before.concat(transforms.before || []);
        transforms.after = after.concat(transforms.after || []);
        transforms.afterDeclarations = afterDeclarations.concat(
          transforms.afterDeclarations || [],
        );

        return origProgramEmit(
          targetSourceFile,
          writeFile,
          cancellationToken,
          emitOnlyDtsFiles,
          transforms,
        );
      };
      return program as any;
    };
  }

  private createDiagnosticReporter(
    diagnosticReporter: (diagnostic: ts.Diagnostic, ...args: any[]) => any,
  ) {
    return function (this: any, diagnostic: ts.Diagnostic, ...args: any[]) {
      return diagnosticReporter.call(this, diagnostic, ...args);
    };
  }

  private createWatchStatusChanged(
    watchStatusReporter: (diagnostic: ts.Diagnostic, ...args: any[]) => any,
    onSuccess?: () => void,
  ) {
    return function (this: any, diagnostic: ts.Diagnostic, ...args: any[]) {
      const messageText = diagnostic && diagnostic.messageText;
      const noErrorsMessage = '0 errors';
      if (
        messageText &&
        (messageText as string).includes &&
        (messageText as string).includes(noErrorsMessage) &&
        onSuccess
      ) {
        onSuccess();
      }
      return watchStatusReporter.call(this, diagnostic, ...args);
    };
  }
}
