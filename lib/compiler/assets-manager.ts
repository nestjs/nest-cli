import * as chokidar from 'chokidar';
import { copyFileSync, mkdirSync, rmSync, statSync } from 'fs';
import { sync } from 'glob';
import { dirname, join, sep } from 'path';
import { ActionOnFile, Asset, AssetEntry, Configuration } from '../configuration';
import { copyPathResolve } from './helpers/copy-path-resolve';
import { getValueOrDefault } from './helpers/get-value-or-default';

export class AssetsManager {
  private watchAssetsKeyValue: { [key: string]: boolean } = {};
  private watchers: chokidar.FSWatcher[] = [];
  private actionInProgress = false;

  /**
   * Using on `nest build` to close file watch or the build process will not end
   * Interval like process
   * If no action has been taken recently close watchers
   * If action has been taken recently flag and try again
   */
  public closeWatchers() {
    // Consider adjusting this for larger files
    const timeoutMs = 500;
    const closeFn = () => {
      if (this.actionInProgress) {
        this.actionInProgress = false;
        setTimeout(closeFn, timeoutMs);
      } else {
        this.watchers.forEach((watcher) => watcher.close());
      }
    };

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
          path: '',
          sourceRoot,
          watchAssetsMode: isWatchEnabled,
        };

        if (isWatchEnabled || item.watchAssets) {
          // prettier-ignore
          const watcher = chokidar
            .watch(item.glob, { ignored: item.exclude })
            .on('add', (path: string) => this.actionOnFile({ ...option, path, action: 'change' }))
            .on('change', (path: string) => this.actionOnFile({ ...option, path, action: 'change' }))
            .on('unlink', (path: string) => this.actionOnFile({ ...option, path, action: 'unlink' }));

          this.watchers.push(watcher);
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
        `An error occurred during the assets copying process. ${err.message}`,
      );
    }
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
    // Set action to true to avoid watches getting cutoff
    this.actionInProgress = true;

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
