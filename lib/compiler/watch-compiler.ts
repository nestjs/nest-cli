import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { CLI_ERRORS } from '../ui/errors';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { tsconfigPathsBeforeHookFactory } from './hooks/tsconfig-paths.hook';
import { PluginsLoader } from './plugins-loader';

export class WatchCompiler {
  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    configFilename: string,
    appName: string,
    onSuccess?: () => void,
  ) {
    const configPath = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      configFilename,
    );
    if (!configPath) {
      throw new Error(CLI_ERRORS.MISSING_TYPESCRIPT(configFilename));
    }

    const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;
    const origDiagnosticReporter = (ts as any).createDiagnosticReporter(
      ts.sys,
      true,
    );
    const origWatchStatusReporter = (ts as any).createWatchStatusReporter(
      ts.sys,
    );
    const host = ts.createWatchCompilerHost(
      configPath,
      {},
      ts.sys,
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
      options: ts.CompilerOptions,
      // tslint:disable-next-line:no-shadowed-variable
      host: ts.CompilerHost,
      oldProgram: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    ) => {
      const tsconfigPathsPlugin = tsconfigPathsBeforeHookFactory(options);
      plugins.beforeHooks.push(tsconfigPathsPlugin);

      const program = origCreateProgram(rootNames, options, host, oldProgram);
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
        transforms.before = plugins.beforeHooks.concat(transforms.before || []);
        transforms.after = plugins.afterHooks.concat(transforms.after || []);

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

    ts.createWatchProgram(host);
  }

  private createDiagnosticReporter(
    diagnosticReporter: (diagnostic: ts.Diagnostic, ...args: any[]) => any,
  ) {
    return function(this: any, diagnostic: ts.Diagnostic, ...args: any[]) {
      return diagnosticReporter.call(this, diagnostic, ...args);
    };
  }

  private createWatchStatusChanged(
    watchStatusReporter: (diagnostic: ts.Diagnostic, ...args: any[]) => any,
    onSuccess?: () => void,
  ) {
    return function(this: any, diagnostic: ts.Diagnostic, ...args: any[]) {
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
