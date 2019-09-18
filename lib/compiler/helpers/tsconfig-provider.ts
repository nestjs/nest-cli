import { existsSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';

export class TsConfigProvider {
  public getByConfigFilename(configFilename: string) {
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
    return { options, fileNames };
  }
}
