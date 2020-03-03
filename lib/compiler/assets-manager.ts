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

  /**
   * Using on `nest build` to close file watch or the build process will not end
   */
  public closeWatchers() {
    setTimeout(() => this.watchers.forEach(watcher => watcher.close()), 300);
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

      const filesToCopy = assets.map<AssetEntry>(item => {
        if (typeof item === 'string') {
          return {
            glob: join(sourceRoot, item),
            outDir,
          };
        }
        return {
          outDir: item.outDir || outDir,
          glob: join(sourceRoot, item.include!),
          exclude: item.exclude ? join(sourceRoot, item.exclude) : undefined,
          flat: item.flat, // deprecated field
          watchAssets: item.watchAssets,
        };
      });

      const isWatchEnabled =
        getValueOrDefault<boolean>(
          configuration,
          'compilerOptions.watchAssets',
          appName,
        ) || watchAssetsMode;

      for (const item of filesToCopy) {
        const opt: ActionOnFile = {
          action: 'change',
          item,
          path: '',
          sourceRoot,
          watchAssetsMode: isWatchEnabled,
        };

        // prettier-ignore
        const watcher = chokidar
          .watch(item.glob, { ignored: item.exclude })
          .on('add',    path => this.actionOnFile({ ...opt, path, action: 'change' }))
          .on('change', path => this.actionOnFile({ ...opt, path, action: 'change' }))
          .on('unlink', path => this.actionOnFile({ ...opt, path, action: 'unlink' }));

        this.watchers.push(watcher);
      }
    } catch (err) {
      throw new Error(
        `An error occurred during the assets copying process. ${err.message}`,
      );
    }
  }

  private actionOnFile(opt: ActionOnFile) {
    const { action, item, path, sourceRoot, watchAssetsMode } = opt;
    const isWatchEnabled = watchAssetsMode || item.watchAssets;

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
    }

    // Remove from output dir if file is deleted
    else if (action === 'unlink') {
      shell.rm(dest);
    }
  }
}
