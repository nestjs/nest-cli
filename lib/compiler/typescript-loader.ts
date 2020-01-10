import { existsSync } from 'fs';
import { join, resolve } from 'path';
import * as ts from 'typescript';

export class TypeScriptBinaryLoader {
  private tsBinary?: typeof ts;

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }
    const nodeModulePaths = [
      join(process.cwd(), 'node_modules'),
      ...this.getModulePaths(),
    ];
    let tsBinary;
    for (const path of nodeModulePaths) {
      const binaryPath = resolve(path, 'typescript');
      if (existsSync(binaryPath)) {
        tsBinary = require(binaryPath);
        break;
      }
    }
    if (!tsBinary) {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.',
      );
    }
    this.tsBinary = tsBinary;
    return tsBinary;
  }

  public getModulePaths() {
    const modulePaths = module.paths.slice(2, module.paths.length);
    const packageDeps = modulePaths.slice(0, 3);
    return [
      ...packageDeps.reverse(),
      ...modulePaths.slice(3, modulePaths.length).reverse(),
    ];
  }
}
