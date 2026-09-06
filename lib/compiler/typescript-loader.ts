import { createRequire } from 'module';
import * as ts from 'typescript';
import { CLI_ERRORS } from '../ui/index.js';
import {
  NativeApi,
  NativeTypeScriptModule,
} from './interfaces/native-typescript.interface.js';

const require = createRequire(import.meta.url);

/**
 * Entry point of the programmatic API shipped by the native (Go) compiler.
 * TypeScript 7.0 already exports it but only with config parsing; program
 * creation and emit arrived in 7.1, so the surface is probed, not the version.
 */
const NATIVE_API_ENTRY_POINT = 'typescript/unstable/sync';

export class TypeScriptBinaryLoader {
  private tsBinary?: typeof ts;
  private installedTypeScript?: typeof ts;
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
      return hasClassicApi(this.loadInstalledTypeScript());
    } catch {
      return false;
    }
  }

  /**
   * Whether the installed TypeScript ships a native API complete enough for
   * the CLI (TypeScript 7.1+).
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
   * TypeScript, or `null` when it is absent or incomplete. Detection is a
   * feature probe on purpose, so that `npm:` aliases and prereleases keep
   * working. The result is memoized; a module that exists but fails to load
   * is a broken installation and is reported as such.
   */
  public loadNativeModule(): NativeTypeScriptModule | null {
    if (this.nativeModule !== undefined) {
      return this.nativeModule;
    }
    let entryPath: string;
    try {
      entryPath = require.resolve(NATIVE_API_ENTRY_POINT, {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
    } catch {
      // Not exported by the installed package: TypeScript 6 or older.
      this.nativeModule = null;
      return this.nativeModule;
    }
    const candidate = require(entryPath) as Partial<NativeTypeScriptModule>;
    this.nativeModule = isCompleteNativeModule(candidate) ? candidate : null;
    return this.nativeModule;
  }

  /**
   * Returns the native module, throwing an actionable error when the
   * installed TypeScript does not provide one.
   */
  public getNativeModule(): NativeTypeScriptModule {
    const nativeModule = this.loadNativeModule();
    if (!nativeModule) {
      throw new Error(
        CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION(this.getInstalledVersion()),
      );
    }
    return nativeModule;
  }

  /**
   * Returns a shared API session against the native compiler. The session
   * spawns a `tsc` server process, so it is created lazily and reused.
   */
  public loadNativeApi(): NativeApi {
    if (this.nativeApi) {
      return this.nativeApi;
    }
    this.nativeApi = new (this.getNativeModule().API)({ cwd: process.cwd() });
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
    if (this.installedTypeScript) {
      return this.installedTypeScript;
    }
    try {
      const tsBinaryPath = require.resolve('typescript', {
        paths: [process.cwd(), ...this.getModulePaths()],
      });
      this.installedTypeScript = require(tsBinaryPath);
      return this.installedTypeScript!;
    } catch {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.',
      );
    }
  }

  private getInstalledVersion(): string {
    try {
      return this.loadInstalledTypeScript().version ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private assertProgrammaticApiIsSupported(tsBinary: typeof ts): void {
    if (hasClassicApi(tsBinary)) {
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

function hasClassicApi(tsBinary: typeof ts): boolean {
  return typeof tsBinary.getParsedCommandLineOfConfigFile === 'function';
}

/**
 * TypeScript 7.0's `unstable/sync` has `API.parseConfigFile` but neither
 * `createProgram` nor the diagnostics formatter; 7.1 adds both.
 */
function isCompleteNativeModule(
  candidate: Partial<NativeTypeScriptModule>,
): candidate is NativeTypeScriptModule {
  return (
    typeof candidate.API === 'function' &&
    'createProgram' in candidate.API.prototype &&
    'parseConfigFile' in candidate.API.prototype &&
    typeof candidate.formatDiagnosticsWithColorAndContext === 'function'
  );
}
