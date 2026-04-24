import { createRequire } from 'module';
import * as ts from 'typescript';

const require = createRequire(import.meta.url);

export class TypeScriptBinaryLoader {
  private tsBinary?: typeof ts;

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }

    try {
      const tsBinaryPath = require.resolve('typescript', {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
      const tsBinary = require(tsBinaryPath);
      this.tsBinary = tsBinary;
      return tsBinary;
    } catch {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.',
      );
    }
  }

  public getModulePaths() {
    const modulePaths = require.resolve.paths('typescript') ?? [];
    const packageDeps = modulePaths.slice(0, 3);
    return [
      ...packageDeps.reverse(),
      ...modulePaths.slice(3, modulePaths.length).reverse(),
    ];
  }
}
