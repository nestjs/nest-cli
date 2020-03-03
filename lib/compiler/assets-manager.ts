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

  public copyAssets(
    configuration: Required<Configuration>,
    appName: string,
    outDir: string,
    watchMode: boolean,
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
          flat: item.flat,
        };
      });

      for (const item of filesToCopy) {
        const opt: ActionOnFile = {
          action: 'change',
          item,
          path: '',
          sourceRoot,
          watchMode,
        };

        // prettier-ignore
        chokidar
          .watch(item.glob, { ignored: item.exclude })
          .on('add',    path => this.actionOnFile({ ...opt, path, action: 'change' }))
          .on('change', path => this.actionOnFile({ ...opt, path, action: 'change' }))
          .on('unlink', path => this.actionOnFile({ ...opt, path, action: 'unlink' }));
      }
    } catch (err) {
      throw new Error(
        `An error occurred during the assets copying process. ${err.message}`,
      );
    }
  }

  private actionOnFile(opt: ActionOnFile) {
    const { action, item, path, sourceRoot, watchMode } = opt;

    // Allow to do action for the first time before check watchMode
    if (!watchMode && this.watchAssetsKeyValue[path]) {
      return;
    }
    this.watchAssetsKeyValue[path] = true; // Set path value to true for watching the first time

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
