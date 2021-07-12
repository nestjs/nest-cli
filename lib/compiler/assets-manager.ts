import * as chokidar from 'chokidar';
import { dirname, join, sep } from 'path';
import * as shell from 'shelljs';
import {
  ActionOnFile,
  Asset,
  AssetEntry,
  Configuration,
} from '../configuration';
import { copyPathResolve } from './helpers/copy-path-resolve';
import { getValueOrDefault } from './helpers/get-value-or-default';

export class AssetsManager {
  private watchAssetsKeyValue: { [key: string]: boolean } = {};
  private watchers: chokidar.FSWatcher[] = [];
  private initialLoadPhase = true; // set to false once initial load has concluded, as we don't want to restart the server when files are initially loaded

  /**
   * Using on `nest build` to close file watch or the build process will not end
   */
  public closeWatchers() {
    const timeoutMs = 300;
    const closeFn = () => this.watchers.forEach((watcher) => watcher.close());

    setTimeout(closeFn, timeoutMs);
  }

  public copyAssets(
    configuration: Required<Configuration>,
    appName: string,
    outDir: string,
    watchAssetsMode: boolean,
  ) {
    const assets =
      getValueOrDefault<Asset[]>(
        configuration,
        'compilerOptions.assets',
        appName,
      ) || [];

    if (assets.length <= 0) {
      return;
    }

    try {
      let sourceRoot = getValueOrDefault(configuration, 'sourceRoot', appName);
      sourceRoot = join(process.cwd(), sourceRoot);

      const filesToCopy = assets.map<AssetEntry>((item) => {
        if (typeof item === 'string') {
          return {
            glob: join(sourceRoot, item),
            outDir,
            reload: false,
          };
        }
        return {
          outDir: item.outDir || outDir,
          glob: join(sourceRoot, item.include!),
          exclude: item.exclude ? join(sourceRoot, item.exclude) : undefined,
          flat: item.flat, // deprecated field
          watchAssets: item.watchAssets,
          reload: item.reload ?? false,
        };
      });

      const isWatchEnabled =
        getValueOrDefault<boolean>(
          configuration,
          'compilerOptions.watchAssets',
          appName,
        ) || watchAssetsMode;

      for (const item of filesToCopy) {
        const option: ActionOnFile = {
          action: 'change',
          item,
          path: '', // why is this always an empty string?
          sourceRoot,
          reload: item.reload,
          watchAssetsMode: isWatchEnabled,
        };

        // prettier-ignore
        const watcher = chokidar
          .watch(item.glob, { ignored: item.exclude })
          .on('add', (path: string) => this.actionOnFile({ ...option, path, action: 'change' }))
          .on('change', (path: string) => this.actionOnFile({ ...option, path, action: 'change' }))
          .on('unlink', (path: string) => this.actionOnFile({ ...option, path, action: 'unlink' }));

        this.watchers.push(watcher);
      }

      // all file watchers added, now schedule the end of initial load phase
      setTimeout(() => {
        this.initialLoadPhase = false;
      }, getValueOrDefault<number>(configuration, 'compilerOptions.loadTimeout', appName, 'path', undefined, 30000));
    } catch (err) {
      throw new Error(
        `An error occurred during the assets copying process. ${err.message}`,
      );
    }
  }

  private actionOnFile(option: ActionOnFile) {
    const { action, item, path, sourceRoot, watchAssetsMode, reload } = option;
    const isWatchEnabled = watchAssetsMode || item.watchAssets;
    const shouldReloadOnChange = reload && isWatchEnabled;

    // Allow to do action for the first time before check watchMode
    if (!isWatchEnabled && this.watchAssetsKeyValue[path]) {
      return;
    }

    // Set path value to true for watching the first time
    this.watchAssetsKeyValue[path] = true;

    const dest = copyPathResolve(
      path,
      item.outDir!,
      sourceRoot.split(sep).length,
    );

    // Copy to output dir if file is changed or added
    if (action === 'change') {
      shell.mkdir('-p', dirname(dest));
      shell.cp(path, dest);
    } else if (action === 'unlink') {
      // Remove from output dir if file is deleted
      shell.rm(dest);
    }

    // TODO: trigger reload if new file added after initial load phase
    if (shouldReloadOnChange) {
      this.closeWatchers();
      // TODO: how to reload server here?????
    }
  }
}
