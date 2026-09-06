import { Configuration } from '../../configuration/index.js';
import { NativeCompilerOptions } from '../interfaces/native-typescript.interface.js';
import { NativeCompilerBase } from './native-compiler-base.js';

/**
 * One-shot `nest build` on the native TypeScript compiler (TypeScript 7.1+).
 * Counterpart of `Compiler` (classic API).
 */
export class NativeCompiler extends NativeCompilerBase {
  public run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    _extras: unknown,
    onSuccess?: () => void,
  ) {
    let errorsCount = 0;
    // The API session (a `tsc` server process) may already have been opened
    // by `TsConfigProvider` before this method runs, so it is closed on every
    // path, including the ones that throw before a program exists.
    try {
      this.assertNoPluginsConfigured(configuration, appName);

      const {
        options,
        fileNames,
        projectReferences,
        configFileParsingDiagnostics,
      } = this.tsConfigProvider.getByConfigFilename(tsConfigPath);
      const compilerOptions = options as unknown as NativeCompilerOptions;
      this.assertNoPathsConfigured(compilerOptions);

      const api = this.typescriptLoader.loadNativeApi();
      const program = api.createProgram(fileNames, {
        compilerOptions,
        projectReferences: projectReferences as any,
        configFileParsingDiagnostics,
      });
      try {
        errorsCount = this.emitAndReport(program, compilerOptions);
      } finally {
        program.dispose();
      }
    } finally {
      this.typescriptLoader.closeNativeApi();
    }

    if (errorsCount) {
      process.exit(1);
    } else if (onSuccess) {
      onSuccess();
    }
  }
}
