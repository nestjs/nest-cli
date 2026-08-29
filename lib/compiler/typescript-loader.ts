import { createRequire } from 'module';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../ui/index.js';

const require = createRequire(import.meta.url);

export class TypeScriptBinaryLoader {
  private tsBinary?: typeof ts;

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }

    let tsBinary: typeof ts;
    try {
      const tsBinaryPath = require.resolve(this.resolveTypeScriptPackage(), {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
      tsBinary = require(tsBinaryPath);
    } catch {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.',
      );
    }

    this.assertProgrammaticApiIsSupported(tsBinary);
    this.tsBinary = tsBinary;
    return tsBinary;
  }

  // TypeScript 7.0 native compiler does not expose the programmatic API.
  // Prefer the TypeScript 6 compatibility alias when it is installed.
  // TODO: Remove this once the programmatic API is available in TS 7.1
  private resolveTypeScriptPackage(): string {
    try {
      require.resolve('@typescript/typescript6', {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
      return '@typescript/typescript6';
    } catch {
      return 'typescript';
    }
  }

  private assertProgrammaticApiIsSupported(tsBinary: typeof ts): void {
    if (typeof tsBinary.getParsedCommandLineOfConfigFile !== 'function') {
      throw new Error(
        CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION(tsBinary.version),
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
