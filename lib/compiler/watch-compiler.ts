import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { CLI_ERRORS } from '../ui/errors';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { TsConfigProvider } from './helpers/tsconfig-provider';
import { tsconfigPathsBeforeHookFactory } from './hooks/tsconfig-paths.hook';
import { PluginsLoader } from './plugins-loader';
import { TypeScriptBinaryLoader } from './typescript-loader';

export class WatchCompiler {
  constructor(
    private readonly pluginsLoader: PluginsLoader,
    private readonly tsConfigProvider: TsConfigProvider,
    private readonly typescriptLoader: TypeScriptBinaryLoader,
  ) {}

  public run(
    configuration: Required<Configuration>,
    configFilename: string,
    appName: string,
    tsCompilerOptions: ts.CompilerOptions,
    onSuccess?: () => void,
  ) {
    const tsBin = this.typescriptLoader.load();
    const configPath = tsBin.findConfigFile(
      process.cwd(),
      tsBin.sys.fileExists,
      configFilename,
    );
    if (!configPath) {
      throw new Error(CLI_ERRORS.MISSING_TYPESCRIPT(configFilename));
    }
    const { projectReferences } =
      this.tsConfigProvider.getByConfigFilename(configFilename);

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
      tsCompilerOptions,
      tsBin.sys,
      createProgram,
      this.createDiagnosticReporter(origDiagnosticReporter),
      this.createWatchStatusChanged(origWatchStatusReporter, onSuccess),
    );

    const pluginsConfig = getValueOrDefault(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    const plugins = this.pluginsLoader.load(pluginsConfig);
    const origCreateProgram = host.createProgram;
    (host as any).createProgram = (
      rootNames: ReadonlyArray<string>,
      options: ts.CompilerOptions | undefined,
      // tslint:disable-next-line:no-shadowed-variable
      host: ts.CompilerHost,
      oldProgram: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    ) => {
      const tsconfigPathsPlugin = options ? tsconfigPathsBeforeHookFactory(options) : null;
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

    tsBin.createWatchProgram(host);
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
