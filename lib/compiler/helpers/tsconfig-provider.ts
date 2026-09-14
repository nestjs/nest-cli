import { existsSync } from 'fs';
import { dirname, isAbsolute, join, relative } from 'path';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../../ui/index.js';
import { NativeDiagnostic } from '../interfaces/native-typescript.interface.js';
import { TypeScriptBinaryLoader } from '../typescript-loader.js';

export type TsConfigProviderOutput = Pick<
  ts.ParsedCommandLine,
  'options' | 'fileNames' | 'projectReferences'
> & {
  exclude: string[];
  /**
   * Diagnostics produced while parsing the config file. The classic compiler
   * reports these itself through `program.getConfigFileParsingDiagnostics()`;
   * the native compiler (TypeScript 7.1+) only does so when they are handed
   * to `createProgram`, which is what the native compilers use this for.
   */
  configFileParsingDiagnostics: readonly NativeDiagnostic[];
};

export class TsConfigProvider {
  constructor(private readonly typescriptLoader: TypeScriptBinaryLoader) {}

  public getByConfigFilename(configFilename: string): TsConfigProviderOutput {
    const configPath = join(process.cwd(), configFilename);
    if (!existsSync(configPath)) {
      throw new Error(CLI_ERRORS.MISSING_TYPESCRIPT(configFilename));
    }
    const parsedCmd = this.typescriptLoader.isNativeApiRequired()
      ? this.parseWithNativeApi(configPath)
      : this.parseWithClassicApi(configPath);
    if (!parsedCmd) {
      throw new Error(
        `Could not parse TypeScript configuration file "${configFilename}". Please, ensure that the file contains valid JSON and compiler options.`,
      );
    }
    const { options, fileNames, projectReferences, raw, errors } = parsedCmd;

    const exclude = this.normalizeExclude(
      this.parseExclude(raw?.exclude),
      configPath,
    );

    return {
      options,
      fileNames,
      projectReferences,
      exclude,
      configFileParsingDiagnostics: errors ?? [],
    };
  }

  private parseWithClassicApi(configPath: string) {
    const tsBinary = this.typescriptLoader.load();
    return tsBinary.getParsedCommandLineOfConfigFile(
      configPath,
      undefined!,
      tsBinary.sys as unknown as ts.ParseConfigFileHost,
    );
  }

  /**
   * TypeScript 7.1+ (native compiler) has no `getParsedCommandLineOfConfigFile`;
   * the equivalent lives on the API session. The returned shape is the same
   * subset the classic call gives, so callers do not need to care which
   * compiler produced it.
   */
  private parseWithNativeApi(
    configPath: string,
  ): Pick<
    ts.ParsedCommandLine,
    'options' | 'fileNames' | 'projectReferences' | 'raw'
  > & { errors: readonly NativeDiagnostic[] } {
    const api = this.typescriptLoader.loadNativeApi();
    const parsed = api.parseConfigFile(configPath);
    return {
      options: parsed.options as unknown as ts.CompilerOptions,
      fileNames: parsed.fileNames,
      projectReferences: parsed.projectReferences as unknown as
        readonly ts.ProjectReference[] | undefined,
      raw: parsed.raw,
      errors: parsed.errors ?? [],
    };
  }

  private parseExclude(exclude: unknown): string[] {
    const passesTypeValidation =
      Array.isArray(exclude) &&
      exclude.every((item) => typeof item === 'string');

    if (!passesTypeValidation) {
      return [];
    }

    return exclude;
  }

  private normalizeExclude(exclude: string[], configPath: string): string[] {
    const configDir = dirname(configPath);
    const relativeConfigDir = relative(process.cwd(), configDir);

    return exclude.map((pattern) => {
      const normalized = isAbsolute(pattern)
        ? relative(process.cwd(), pattern)
        : join(relativeConfigDir, pattern);

      return normalized.replace(/\\/g, '/');
    });
  }
}
