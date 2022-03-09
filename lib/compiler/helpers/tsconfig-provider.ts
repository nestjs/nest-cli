import { existsSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../../ui';
import { TypeScriptBinaryLoader } from '../typescript-loader';

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
    const { options, fileNames, projectReferences } = parsedCmd!;
    return { options, fileNames, projectReferences };
  }
}
