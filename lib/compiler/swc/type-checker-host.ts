import * as chalk from 'chalk';
import * as ora from 'ora';
import * as ts from 'typescript';
import { TsConfigProvider } from '../helpers/tsconfig-provider';
import { TypeScriptBinaryLoader } from '../typescript-loader';
import {
  INITIALIZING_TYPE_CHECKER,
  TSC_LOG_ERROR_PREFIX,
  TSC_NO_ERRORS_MESSAGE,
} from './constants';

export interface TypeCheckerHostRunOptions {
  watch?: boolean;
  onTypeCheck?: (program: ts.Program) => void;
  onProgramInit?: (program: ts.Program) => void;
}

export class TypeCheckerHost {
  private readonly typescriptLoader = new TypeScriptBinaryLoader();
  private readonly tsConfigProvider = new TsConfigProvider(
    this.typescriptLoader,
  );

  public run(
    tsconfigPath: string | undefined,
    options: TypeCheckerHostRunOptions,
  ) {
    if (!tsconfigPath) {
      throw new Error(
        '"tsconfigPath" is required when "tsProgramRef" is not provided.',
      );
    }
    const tsBinary = this.typescriptLoader.load();

    const spinner = ora({
      text: INITIALIZING_TYPE_CHECKER,
    });

    if (options.watch) {
      console.log();

      spinner.start();
      this.runInWatchMode(tsconfigPath, tsBinary, options);
      spinner.succeed();
      return;
    }
    spinner.start();
    this.runOnce(tsconfigPath, tsBinary, options);
    spinner.succeed();
  }

  private runInWatchMode(
    tsconfigPath: string,
    tsBinary: typeof ts,
    options: TypeCheckerHostRunOptions,
  ) {
    const { options: tsOptions } =
      this.tsConfigProvider.getByConfigFilename(tsconfigPath);

    let builderProgram: ts.WatchOfConfigFile<ts.BuilderProgram> | undefined =
      undefined;

    const reportWatchStatusCallback = (diagnostic: ts.Diagnostic) => {
      if (diagnostic.messageText !== TSC_NO_ERRORS_MESSAGE) {
        if ((diagnostic.messageText as string)?.includes('Found')) {
          console.log(TSC_LOG_ERROR_PREFIX, chalk.red(diagnostic.messageText));
        }
        return;
      }
      if (!builderProgram) {
        return;
      }
      const tsProgram = builderProgram.getProgram().getProgram();
      options.onTypeCheck?.(tsProgram);
    };

    const host = this.createWatchCompilerHost(
      tsBinary,
      tsconfigPath,
      tsOptions,
      reportWatchStatusCallback,
    );
    builderProgram = tsBinary.createWatchProgram(host);
    process.nextTick(() => {
      options.onProgramInit?.(builderProgram!.getProgram().getProgram());
    });
  }

  private runOnce(
    tsconfigPath: string,
    tsBinary: typeof ts,
    options: TypeCheckerHostRunOptions,
  ) {
    const {
      options: tsOptions,
      fileNames,
      projectReferences,
    } = this.tsConfigProvider.getByConfigFilename(tsconfigPath);

    const createProgram =
      tsBinary.createIncrementalProgram ?? tsBinary.createProgram;

    const program = createProgram.call(ts, {
      rootNames: fileNames,
      projectReferences,
      options: tsOptions,
    });

    const programRef = program.getProgram
      ? program.getProgram()
      : (program as any as ts.Program);

    const diagnostics = tsBinary.getPreEmitDiagnostics(programRef);
    if (diagnostics.length > 0) {
      const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: tsBinary.sys.getCurrentDirectory,
        getNewLine: () => tsBinary.sys.newLine,
      };

      console.log();
      console.log(
        tsBinary.formatDiagnosticsWithColorAndContext(
          diagnostics,
          formatDiagnosticsHost,
        ),
      );
      process.exit(1);
    }
    options.onTypeCheck?.(programRef);
  }

  private createWatchCompilerHost(
    tsBinary: typeof ts,
    tsConfigPath: string,
    options: ts.CompilerOptions,
    reportWatchStatusCallback: ts.WatchStatusReporter,
  ) {
    const origDiagnosticReporter = (tsBinary as any).createDiagnosticReporter(
      tsBinary.sys,
      true,
    );

    const tsOptions = {
      ...options,
      preserveWatchOutput: true,
      noEmit: true,
    };

    return tsBinary.createWatchCompilerHost(
      tsConfigPath,
      tsOptions,
      tsBinary.sys,
      undefined,
      origDiagnosticReporter,
      reportWatchStatusCallback,
    );
  }
}
