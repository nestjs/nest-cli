import { readFileSync, watch as watchFile, type FSWatcher } from 'fs';
import { createRequire } from 'module';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';
import { Configuration } from '../../configuration/index.js';
import { getEffectiveRootDir } from '../helpers/get-effective-root-dir.js';
import { getValueOrDefault } from '../helpers/get-value-or-default.js';
import {
  displayManualRestartTip,
  listenForManualRestart,
} from '../helpers/manual-restart.js';
import {
  NativeCompilerOptions,
  NativeFileChanges,
  NativeProgram,
} from '../interfaces/native-typescript.interface.js';
import {
  RecursiveDirectoryWatcher,
  watchDirectoryRecursively,
} from '../watchers/recursive-directory-watcher.js';
import { NativeCompilerBase } from './native-compiler-base.js';

type NativeWatchCompilerExtras = {
  /**
   * Whether to keep the previous output on screen between rebuilds. Falls
   * back to the tsconfig's 'preserveWatchOutput' when `undefined`, mirroring
   * `WatchCompiler`.
   */
  preserveWatchOutput: boolean | undefined;
};

type FileChangeKind = keyof Omit<NativeFileChanges, 'invalidateAll'>;

const require = createRequire(import.meta.url);

const TS_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];
const JS_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs'];
const REBUILD_DEBOUNCE = 100;

/**
 * `nest build --watch` / `nest start --watch` on the native TypeScript
 * compiler (TypeScript 7.1+). Counterpart of `WatchCompiler` (classic API).
 *
 * The native API has no `createWatchProgram`; instead every batch of file
 * system events derives a new program from the previous one through
 * `api.createProgram(rootFiles, options, oldProgram, fileChanges)`, which
 * lets the compiler reuse everything the change did not invalidate.
 */
export class NativeWatchCompiler extends NativeCompilerBase<NativeWatchCompilerExtras> {
  private program?: NativeProgram;
  private sourceWatcher?: RecursiveDirectoryWatcher;
  private configWatchers: FSWatcher[] = [];
  private pendingChanges: NativeFileChanges = {};
  private rebuildTimer?: NodeJS.Timeout;
  private closed = false;
  private ignoredDirs: string[] = [];
  private configFiles: string[] = [];
  private onBatch: () => void = () => undefined;
  private exitHandlerInstalled = false;

  public async run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: NativeWatchCompilerExtras,
    onSuccess?: () => void,
  ) {
    const nativeTs = this.loadNativeTypeScript();
    this.assertNoPluginsConfigured(configuration, appName);
    const api = this.typescriptLoader.loadNativeApi();
    this.installExitHandler();

    const manualRestart = getValueOrDefault(
      configuration,
      'compilerOptions.manualRestart',
      appName,
    );

    // Synchronous on purpose: the native API client blocks on each request,
    // so a rebuild can never overlap with the previous one, and file events
    // that arrive meanwhile are simply queued for the next batch.
    const compile = (changes?: NativeFileChanges) => {
      const {
        options,
        fileNames,
        projectReferences,
        configFileParsingDiagnostics,
      } = this.tsConfigProvider.getByConfigFilename(tsConfigPath);
      const compilerOptions = options as unknown as NativeCompilerOptions;
      const preserveWatchOutput =
        extras.preserveWatchOutput ?? !!compilerOptions.preserveWatchOutput;

      if (!this.program) {
        this.warnIfPathsConfigured(compilerOptions);
        this.log('Starting compilation in watch mode...', !preserveWatchOutput);
      } else {
        this.log(
          'File change detected. Starting incremental compilation...',
          !preserveWatchOutput,
        );
      }

      const previous = this.program;
      // A change to any config file (tsconfig, or one it extends) may alter
      // compiler options, so nothing from the previous program can be reused.
      const configChanged =
        changes !== undefined &&
        previous !== undefined &&
        touchesAny(changes, this.configFiles);
      const program = api.createProgram(
        fileNames,
        {
          compilerOptions,
          projectReferences: projectReferences as any,
          configFileParsingDiagnostics,
        },
        previous,
        configChanged ? { ...changes, invalidateAll: true } : changes,
      );
      this.program = program;
      previous?.dispose();

      const emitResult = program.emit();
      const diagnostics = [
        ...this.collectDiagnostics(program, compilerOptions),
        ...emitResult.diagnostics,
      ];
      if (diagnostics.length > 0) {
        console.error(
          nativeTs.formatDiagnosticsWithColorAndContext(diagnostics, program),
        );
      }
      this.log(
        `Found ${diagnostics.length} error${diagnostics.length === 1 ? '' : 's'}. Watching for file changes.`,
      );
      if (diagnostics.length === 0 && onSuccess) {
        onSuccess();
      }
      // `getConfigFileNames()` is only populated for projects opened by the
      // server; a program created from parsed options reports none, so the
      // `extends` chain is resolved from the config file itself.
      this.configFiles = this.resolveConfigChain(
        resolve(process.cwd(), tsConfigPath),
      );
      return {
        compilerOptions,
        rootDir: getEffectiveRootDir(compilerOptions.rootDir, fileNames),
      };
    };

    const flush = () => {
      if (this.closed) {
        return;
      }
      const changes = this.pendingChanges;
      this.pendingChanges = {};
      try {
        compile(changes);
      } catch (err) {
        // The batch stays pending so that the next rebuild still sees it;
        // otherwise the reused program would keep stale file contents.
        this.pendingChanges = mergeChanges(changes, this.pendingChanges);
        console.error((err as Error).message);
      }
    };

    const initial = compile();

    if (manualRestart) {
      displayManualRestartTip();
    }

    const sourceDir =
      initial.rootDir ??
      this.getPathToSource(configuration, tsConfigPath, appName);
    this.ignoredDirs = [
      resolve(process.cwd(), 'node_modules'),
      ...(initial.compilerOptions.outDir
        ? [resolve(process.cwd(), initial.compilerOptions.outDir)]
        : []),
    ];
    const extensions = [
      ...TS_EXTENSIONS,
      ...(initial.compilerOptions.allowJs ? JS_EXTENSIONS : []),
      ...(initial.compilerOptions.resolveJsonModule ? ['.json'] : []),
    ];

    await this.watch(sourceDir, extensions, this.configFiles, flush);

    if (manualRestart) {
      const restart = () => {
        this.close()
          .then(() => {
            this.closed = false;
            return this.run(
              configuration,
              tsConfigPath,
              appName,
              extras,
              onSuccess,
            );
          })
          .catch((err: Error) => {
            console.error(err.message);
            // Nothing is watching any more; do not leave a watcher that looks
            // alive but never rebuilds. `rs` still restarts it.
            return this.close().then(() => listenForManualRestart(restart));
          });
      };
      listenForManualRestart(restart);
    }
  }

  public async close() {
    this.closed = true;
    clearTimeout(this.rebuildTimer);
    this.rebuildTimer = undefined;
    this.pendingChanges = {};
    for (const watcher of this.configWatchers) {
      watcher.close();
    }
    this.configWatchers = [];
    await this.sourceWatcher?.close();
    this.sourceWatcher = undefined;
    this.program?.dispose();
    this.program = undefined;
  }

  private async watch(
    dir: string,
    extensions: string[],
    configFiles: readonly string[],
    onBatch: () => void,
  ) {
    this.onBatch = onBatch;
    this.sourceWatcher = await watchDirectoryRecursively(dir, {
      extensions,
      onAdd: (file) => this.record('created', file),
      onChange: (file) => this.record('changed', file),
      onUnlink: (file) => this.record('deleted', file),
    });
    // Editors and tools commonly replace a config file (write to a temp file,
    // then rename), which kills a watcher attached to the file itself, so the
    // parent directories are watched instead and events filtered by name.
    const byDirectory = new Map<string, Set<string>>();
    for (const configFile of configFiles) {
      const dir = dirname(configFile);
      (byDirectory.get(dir) ?? byDirectory.set(dir, new Set()).get(dir)!).add(
        basename(configFile),
      );
    }
    for (const [dir, names] of byDirectory) {
      try {
        const watcher = watchFile(dir, (_, filename) => {
          const name = filename?.toString();
          if (name && names.has(name)) {
            this.record('changed', join(dir, name));
          }
        });
        watcher.on('error', () => undefined);
        this.configWatchers.push(watcher);
      } catch {
        // A directory that vanished is reported by the next compilation.
      }
    }
  }

  /**
   * The tsconfig plus every file it (transitively) extends, best effort: an
   * `extends` that cannot be read is skipped, the compiler reports it.
   */
  private resolveConfigChain(configPath: string): string[] {
    const chain: string[] = [];
    const visit = (file: string) => {
      if (chain.includes(file)) {
        return;
      }
      chain.push(file);
      let parsed: { extends?: string | string[] };
      try {
        parsed = JSON.parse(stripJsonComments(readFileSync(file, 'utf8')));
      } catch {
        return;
      }
      const parents = Array.isArray(parsed.extends)
        ? parsed.extends
        : parsed.extends
          ? [parsed.extends]
          : [];
      for (const parent of parents) {
        if (typeof parent !== 'string') {
          continue;
        }
        const resolved = parent.startsWith('.')
          ? resolve(dirname(file), parent)
          : this.tryResolveModule(parent, dirname(file));
        if (resolved) {
          visit(resolved.endsWith('.json') ? resolved : `${resolved}.json`);
        }
      }
    };
    visit(configPath);
    return chain;
  }

  private tryResolveModule(
    specifier: string,
    from: string,
  ): string | undefined {
    try {
      return require.resolve(specifier, { paths: [from] });
    } catch {
      try {
        return require.resolve(`${specifier}/tsconfig.json`, { paths: [from] });
      } catch {
        return undefined;
      }
    }
  }

  private record(kind: FileChangeKind, file: string) {
    if (this.closed || this.isIgnored(file)) {
      return;
    }
    (this.pendingChanges[kind] ??= []).push(file);
    this.scheduleRebuild();
  }

  private isIgnored(file: string): boolean {
    const absolute = isAbsolute(file) ? file : resolve(process.cwd(), file);
    return this.ignoredDirs.some((dir) => {
      const rel = relative(dir, absolute);
      return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
    });
  }

  private scheduleRebuild() {
    clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      this.rebuildTimer = undefined;
      this.onBatch();
    }, REBUILD_DEBOUNCE);
  }

  /**
   * The API session is a child process; make sure it does not outlive the
   * CLI when the watch is interrupted (Ctrl+C, `nest start` shutting down).
   */
  private installExitHandler() {
    if (this.exitHandlerInstalled) {
      return;
    }
    this.exitHandlerInstalled = true;
    const release = () => {
      this.program?.dispose();
      this.program = undefined;
      this.typescriptLoader.closeNativeApi();
    };
    process.once('exit', release);
    // `nest build --watch` installs no SIGINT handler of its own (unlike
    // `nest start`), and a signal death skips the 'exit' event.
    process.once('SIGINT', () => {
      release();
      if (process.listenerCount('SIGINT') === 0) {
        process.exit(130);
      }
    });
  }

  private log(message: string, clearScreen = false) {
    if (clearScreen && process.stdout.isTTY) {
      process.stdout.write('\x1Bc');
    }
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${message}`);
  }
}

/**
 * tsconfig files allow comments and trailing commas; only `extends` is read
 * here, so a lenient strip is enough (strings containing `//` are rare in
 * that field and would merely skip the parent).
 */
function stripJsonComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1');
}

function touchesAny(
  changes: NativeFileChanges,
  files: readonly string[],
): boolean {
  const touched = [
    ...(changes.changed ?? []),
    ...(changes.created ?? []),
    ...(changes.deleted ?? []),
  ];
  return touched.some((file) => files.includes(file));
}

function mergeChanges(
  first: NativeFileChanges,
  second: NativeFileChanges,
): NativeFileChanges {
  const merged: NativeFileChanges = {};
  for (const kind of ['changed', 'created', 'deleted'] as FileChangeKind[]) {
    const files = [...(first[kind] ?? []), ...(second[kind] ?? [])];
    if (files.length > 0) {
      merged[kind] = files;
    }
  }
  if (first.invalidateAll || second.invalidateAll) {
    merged.invalidateAll = true;
  }
  return merged;
}
