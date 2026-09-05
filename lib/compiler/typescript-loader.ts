import { createRequire } from 'module';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../ui/index.js';
import {
  NativeApi,
  NativeTypeScriptModule,
} from './interfaces/native-typescript.interface.js';

const require = createRequire(import.meta.url);

/**
 * Entry point of the programmatic API shipped by TypeScript 7.1+.
 * TypeScript 7.0 exposes the `tsc` executable only.
 */
const NATIVE_API_ENTRY_POINT = 'typescript/unstable/sync';

export class TypeScriptBinaryLoader {
  private tsBinary?: typeof ts;
  private nativeModule?: NativeTypeScriptModule | null;
  private nativeApi?: NativeApi;

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }

    const tsBinary = this.loadInstalledTypeScript();
    this.assertProgrammaticApiIsSupported(tsBinary);
    this.tsBinary = tsBinary;
    return tsBinary;
  }

  /**
   * Whether the installed TypeScript exposes the classic (in-process)
   * compiler API, i.e. it is TypeScript 6 or older.
   */
  public hasProgrammaticApi(): boolean {
    try {
      const tsBinary = this.loadInstalledTypeScript();
      return typeof tsBinary.getParsedCommandLineOfConfigFile === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Whether the installed TypeScript is the native (Go) compiler and ships the
   * `typescript/unstable/sync` API (TypeScript 7.1+). Detection is a feature
   * probe on purpose, so that `npm:` aliases and prereleases keep working.
   */
  public hasNativeApi(): boolean {
    return this.loadNativeModule() !== null;
  }

  /**
   * True when the installed TypeScript has no classic compiler API but does
   * expose the native one, i.e. the CLI must compile through the native API.
   */
  public isNativeApiRequired(): boolean {
    return !this.hasProgrammaticApi() && this.hasNativeApi();
  }

  /**
   * Returns the `typescript/unstable/sync` module of the installed
   * TypeScript, throwing an actionable error when it is not available.
   */
  public loadNativeModule(): NativeTypeScriptModule | null {
    if (this.nativeModule !== undefined) {
      return this.nativeModule;
    }
    try {
      const entryPath = require.resolve(NATIVE_API_ENTRY_POINT, {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
      const candidate = require(entryPath) as Partial<NativeTypeScriptModule>;
      this.nativeModule =
        typeof candidate.API === 'function' &&
        typeof candidate.formatDiagnosticsWithColorAndContext === 'function'
          ? (candidate as NativeTypeScriptModule)
          : null;
    } catch {
      this.nativeModule = null;
    }
    return this.nativeModule;
  }

  /**
   * Returns a shared API session against the native compiler. The session
   * spawns a `tsc` server process, so it is created lazily and reused.
   */
  public loadNativeApi(): NativeApi {
    if (this.nativeApi) {
      return this.nativeApi;
    }
    const nativeModule = this.loadNativeModule();
    if (!nativeModule) {
      const version = this.tryGetInstalledVersion();
      throw new Error(CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION(version));
    }
    this.nativeApi = new nativeModule.API({ cwd: process.cwd() });
    return this.nativeApi;
  }

  public closeNativeApi(): void {
    if (!this.nativeApi) {
      return;
    }
    try {
      this.nativeApi.close();
    } finally {
      this.nativeApi = undefined;
    }
  }

  private loadInstalledTypeScript(): typeof ts {
    try {
      const tsBinaryPath = require.resolve('typescript', {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
      return require(tsBinaryPath);
    } catch {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.',
      );
    }
  }

  private tryGetInstalledVersion(): string {
    try {
      return this.loadInstalledTypeScript().version ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private assertProgrammaticApiIsSupported(tsBinary: typeof ts): void {
    if (typeof tsBinary.getParsedCommandLineOfConfigFile === 'function') {
      return;
    }
    // A caller reaching for the classic API while the native one is present
    // is a feature the native path does not cover yet (plugins, swc type
    // checking, webpack); say so instead of asking to install 7.1.
    throw new Error(
      this.hasNativeApi()
        ? CLI_ERRORS.CLASSIC_API_REQUIRED_ON_NATIVE_TYPESCRIPT(tsBinary.version)
        : CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION(tsBinary.version),
    );
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
