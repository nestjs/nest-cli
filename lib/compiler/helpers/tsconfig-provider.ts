import { existsSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../../ui/index.js';
import { TypeScriptBinaryLoader } from '../typescript-loader.js';

export class TsConfigProvider {
  constructor(private readonly typescriptLoader: TypeScriptBinaryLoader) {}

  public getByConfigFilename(configFilename: string) {
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
    if (!parsedCmd) {
      throw new Error(
        `Could not parse TypeScript configuration file "${configFilename}". Please, ensure that the file contains valid JSON and compiler options.`,
      );
    }
    const { options, fileNames, projectReferences } = parsedCmd;
    return { options, fileNames, projectReferences };
  }
}
