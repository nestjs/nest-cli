import * as chokidar from 'chokidar';
import { copyFileSync, mkdirSync, rmSync, statSync } from 'fs';
import { sync } from 'glob';
import { dirname, join, sep } from 'path';
import {
  ActionOnFile,
  Asset,
  AssetEntry,
  Configuration,
} from '../configuration/index.js';
import { copyPathResolve } from './helpers/copy-path-resolve.js';
import { getValueOrDefault } from './helpers/get-value-or-default.js';

const ASSET_CHANGE_RESTART_DEBOUNCE_MS = 150;

export class AssetsManager {
  private watchAssetsKeyValue: { [key: string]: boolean } = {};
  private watchers: chokidar.FSWatcher[] = [];
  private watcherReadyPromises: Promise<void>[] = [];

  /**
   * Using on `nest build` to close file watch or the build process will not end.
   * Waits for all watchers to complete their initial scan before closing them,
   * ensuring all assets are copied regardless of system speed.
   *
   * Returns a Promise that resolves once every watcher has been closed.
   * Callers (e.g. `build.action.ts`, `swc-compiler.ts`) `await` this method,
   * so it must surface the underlying close work — otherwise `await` resolves
   * immediately while file watchers stay open and the build process can race
   * its own exit, leaving handles dangling.
   */
  public async closeWatchers(): Promise<void> {
    await Promise.all(this.watcherReadyPromises);
    await Promise.all(this.watchers.map((watcher) => watcher.close()));
  }

  public copyAssets(
    configuration: Required<Configuration>,
    appName: string | undefined,
    outDir: string,
    watchAssetsMode: boolean,
    onSuccess?: () => void,
    rootDir?: string,
  ) {
    const assets =
      getValueOrDefault<Asset[]>(
        configuration,
        'compilerOptions.assets',
        appName,
      ) || [];

    const includeLibraryAssets =
      getValueOrDefault<string[]>(
        configuration,
        'compilerOptions.includeLibraryAssets',
        appName,
      ) || [];

    const libraryAssets = this.collectLibraryAssets(
      configuration,
      includeLibraryAssets,
      outDir,
    );

    if (assets.length <= 0 && libraryAssets.length <= 0) {
      return;
    }

    try {
      let sourceRoot = getValueOrDefault(configuration, 'sourceRoot', appName);
      sourceRoot = join(process.cwd(), sourceRoot);

      // The asset path stripping must mirror how the TypeScript compiler emits
      // files. When the effective rootDir (either explicit or computed from
      // input files) differs from the configured `sourceRoot` — typically the
      // case when `--path` points at a tsconfig with a different rootDir — we
      // use that rootDir instead so copied assets stay aligned with the
      // emitted JavaScript output. See nestjs/nest-cli#3387.
      const stripRoot = rootDir ? join(rootDir) : sourceRoot;

      const filesToCopy = assets.map<AssetEntry>((item) => {
        let includePath = typeof item === 'string' ? item : item.include!;
        let excludePath =
          typeof item !== 'string' && item.exclude ? item.exclude : undefined;

        includePath = join(sourceRoot, includePath).replace(/\\/g, '/');
        excludePath = excludePath
          ? join(sourceRoot, excludePath).replace(/\\/g, '/')
          : undefined;

        return {
          outDir: typeof item !== 'string' ? item.outDir || outDir : outDir,
          glob: includePath,
          exclude: excludePath,
          flat: typeof item !== 'string' ? item.flat : undefined, // deprecated field
          watchAssets: typeof item !== 'string' ? item.watchAssets : undefined,
        };
      });

      const allFilesToCopy = [...filesToCopy, ...libraryAssets];

      const isWatchEnabled =
        getValueOrDefault<boolean>(
          configuration,
          'compilerOptions.watchAssets',
          appName,
        ) || watchAssetsMode;

      // Debounce onSuccess so that a burst of asset changes (e.g. a git
      // checkout touching many files at once) only triggers a single restart.
      let debouncedOnSuccess: (() => void) | undefined;
      if (onSuccess) {
        let pending: NodeJS.Timeout | undefined;
        debouncedOnSuccess = () => {
          if (pending) {
            clearTimeout(pending);
          }
          pending = setTimeout(() => {
            pending = undefined;
            onSuccess();
          }, ASSET_CHANGE_RESTART_DEBOUNCE_MS);
        };
      }

      for (const item of allFilesToCopy) {
        // Library assets carry their own `_sourceRoot` so the per-library
        // directory layout is preserved verbatim. For application assets we
        // strip relative to the effective tsconfig rootDir (falls back to
        // sourceRoot when no rootDir is supplied or computable).
        const itemSourceRoot = (item as any)._sourceRoot || stripRoot;
        const option: ActionOnFile = {
          action: 'change',
          item,
          path: '',
          sourceRoot: itemSourceRoot,
          watchAssetsMode: isWatchEnabled,
        };

        if (isWatchEnabled || item.watchAssets) {
          const matchedPaths = sync(item.glob, {
            ignore: item.exclude,
            dot: true,
          });

          // Chokidar does not emit the 'ready' event when given an empty
          // array of paths, which causes closeWatchers() to hang forever
          // on Promise.all(watcherReadyPromises). Skip the watcher and
          // warn the user so the build can finish normally.
          if (matchedPaths.length === 0) {
            console.warn(
              `No files matched the asset pattern "${item.glob}". ` +
                `Skipping watcher for this entry.`,
            );
            continue;
          }

          let ready = false;
          // prettier-ignore
          const watcher = chokidar
            .watch(matchedPaths)
            .on('add', (path: string) => {
              this.actionOnFile({ ...option, path, action: 'change' });
              if (ready && debouncedOnSuccess) {
                debouncedOnSuccess();
              }
            })
            .on('change', (path: string) => {
              this.actionOnFile({ ...option, path, action: 'change' });
              if (ready && debouncedOnSuccess) {
                debouncedOnSuccess();
              }
            })
            .on('unlink', (path: string) => {
              this.actionOnFile({ ...option, path, action: 'unlink' });
              if (ready && debouncedOnSuccess) {
                debouncedOnSuccess();
              }
            });

          watcher.on('ready', () => {
            ready = true;
          });

          this.watchers.push(watcher);
          this.watcherReadyPromises.push(
            new Promise<void>((resolve) => watcher.on('ready', resolve)),
          );
        } else {
          const matchedPaths = sync(item.glob, {
            ignore: item.exclude,
            dot: true,
          });
          const files = item.glob.endsWith('*')
            ? matchedPaths.filter((matched) => statSync(matched).isFile())
            : matchedPaths.flatMap((matched) => {
                if (statSync(matched).isDirectory()) {
                  return sync(`${matched}/**/*`, {
                    ignore: item.exclude,
                  }).filter((file) => statSync(file).isFile());
                }
                return matched;
              });

          for (const path of files) {
            this.actionOnFile({ ...option, path, action: 'change' });
          }
        }
      }
    } catch (err) {
      throw new Error(
        `An error occurred during the assets copying process. ${(err as Error).message}`,
        { cause: err },
      );
    }
  }

  private collectLibraryAssets(
    configuration: Required<Configuration>,
    libraryNames: string[],
    outDir: string,
  ): AssetEntry[] {
    if (!libraryNames.length || !configuration.projects) {
      return [];
    }

    const result: AssetEntry[] = [];

    for (const libName of libraryNames) {
      const libProject = configuration.projects[libName];
      if (!libProject) {
        continue;
      }

      const libAssets = libProject.compilerOptions?.assets as
        | Asset[]
        | undefined;
      if (!libAssets || libAssets.length <= 0) {
        continue;
      }

      const libSourceRoot = join(
        process.cwd(),
        libProject.sourceRoot || libProject.root || '',
      );

      for (const item of libAssets) {
        let includePath = typeof item === 'string' ? item : item.include!;
        let excludePath =
          typeof item !== 'string' && item.exclude ? item.exclude : undefined;

        includePath = join(libSourceRoot, includePath).replace(/\\/g, '/');
        excludePath = excludePath
          ? join(libSourceRoot, excludePath).replace(/\\/g, '/')
          : undefined;

        const entry: AssetEntry & { _sourceRoot?: string } = {
          outDir: typeof item !== 'string' ? item.outDir || outDir : outDir,
          glob: includePath,
          exclude: excludePath,
          flat: typeof item !== 'string' ? item.flat : undefined,
          watchAssets: typeof item !== 'string' ? item.watchAssets : undefined,
          _sourceRoot: libSourceRoot,
        };

        result.push(entry);
      }
    }

    return result;
  }

  private actionOnFile(option: ActionOnFile) {
    const { action, item, path, sourceRoot, watchAssetsMode } = option;
    const isWatchEnabled = watchAssetsMode || item.watchAssets;

    const assetCheckKey = path + (item.outDir ?? '');
    // Allow to do action for the first time before check watchMode
    if (!isWatchEnabled && this.watchAssetsKeyValue[assetCheckKey]) {
      return;
    }
    // Set path value to true for watching the first time
    this.watchAssetsKeyValue[assetCheckKey] = true;

    const dest = copyPathResolve(
      path,
      item.outDir!,
      sourceRoot.split(sep).length,
    );

    // Copy to output dir if file is changed or added
    if (action === 'change') {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(path, dest);
    } else if (action === 'unlink') {
      // Remove from output dir if file is deleted
      rmSync(dest, { force: true });
    }
  }
}
