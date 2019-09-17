import { existsSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { Configuration } from '../configuration';
import { PluginsLoader } from './plugins-loader';

export class Compiler {
  private readonly formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };

  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    configFilename: string,
    onSuccess?: () => void,
  ) {
    const configPath = join(process.cwd(), configFilename);
    if (!existsSync(configPath)) {
      throw new Error(
        `Could not find TypeScript configuration file "${configFilename}".`,
      );
    }
    const parsedCmd = ts.getParsedCommandLineOfConfigFile(
      configPath,
      undefined!,
      (ts.sys as unknown) as ts.ParseConfigFileHost,
    );
    const { options, fileNames } = parsedCmd!;
    const program = ts.createProgram({
      rootNames: fileNames,
      options,
    });

    const plugins = this.pluginsLoader.load(
      configuration.compilerOptions.plugins || [],
    );
    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        before: plugins.beforeHooks,
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
