import * as copyfiles from 'copyfiles';
import { join, sep } from 'path';
import { Asset, AssetEntry, Configuration } from '../configuration';
import { getValueOrDefault } from './helpers/get-value-or-default';

export class AssetsManager {
  public async copyAssets(
    configuration: Required<Configuration>,
    appName: string,
    outDir: string,
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

      const filesToCopy = assets.map(item => {
        if (typeof item === 'string') {
          return {
            glob: join(sourceRoot, item),
            outDir,
          } as AssetEntry;
        }
        return {
          outDir: item.outDir || outDir,
          glob: join(sourceRoot, item.include!),
          exclude: item.exclude ? join(sourceRoot, item.exclude) : undefined,
          flat: item.flat,
        };
      });

      const copyFiles = (item: AssetEntry) =>
        new Promise((resolve, reject) =>
          copyfiles(
            [(item as any).glob!, (item as any).outDir!],
            {
              exclude: item.exclude,
              flat: item.flat,
              up: sourceRoot.split(sep).length,
              all: true,
            },
            (err: Error | undefined) => (err ? reject(err) : resolve()),
          ),
        );

      await Promise.all(filesToCopy.map(copyFiles));
    } catch (err) {
      throw new Error(
        `An error occurred during the assets copying process. ${err.message}`,
      );
    }
  }
}
