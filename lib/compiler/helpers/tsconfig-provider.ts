import { existsSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../../ui';
import { TypeScriptBinaryLoader } from '../typescript-loader';

export type TsConfigProviderOutput = Pick<
  ts.ParsedCommandLine,
  'fileNames' | 'projectReferences'
> & {
  options: ts.ParsedCommandLine['options'] & { exclude: string[] };
};

export class TsConfigProvider {
  constructor(private readonly typescriptLoader: TypeScriptBinaryLoader) {}

  private parseExclude(exclude: unknown): string[] {
    const passesTypeValidation =
      Array.isArray(exclude) &&
      exclude.every((item) => typeof item === 'string');

    if (!passesTypeValidation) {
      return [];
    }

    return exclude;
  }

  public getByConfigFilename(configFilename: string): TsConfigProviderOutput {
    const configPath = join(process.cwd(), configFilename);
    if (!existsSync(configPath)) {
      throw new Error(CLI_ERRORS.MISSING_TYPESCRIPT(configFilename));
    }
    const tsBinary = this.typescriptLoader.load();
    const parsedCmd = tsBinary.getParsedCommandLineOfConfigFile(
      configPath,
      undefined!,
      tsBinary.sys as unknown as ts.ParseConfigFileHost,
    );
    const {
      options: rawOptions,
      fileNames,
      projectReferences,
      raw,
    } = parsedCmd!;

    const options = {
      ...rawOptions,
      exclude: this.parseExclude(raw?.exclude),
    };

    return { options, fileNames, projectReferences };
  }
}
