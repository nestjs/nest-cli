import { copyFileSync, mkdirSync, rmSync, statSync } from 'fs';
import { sync } from 'glob';
import * as path from 'path';
import { AssetsManager } from '../../../lib/compiler/assets-manager';
import { Configuration } from '../../../lib/configuration';

jest.mock('fs', () => ({
  copyFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  statSync: jest.fn(),
}));

jest.mock('glob', () => ({
  sync: jest.fn(),
}));

jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    close: jest.fn(),
    on: jest.fn().mockReturnThis(),
  })),
}));

const copyFileSyncMock = copyFileSync as jest.MockedFunction<typeof copyFileSync>;
const mkdirSyncMock = mkdirSync as jest.MockedFunction<typeof mkdirSync>;
const rmSyncMock = rmSync as jest.MockedFunction<typeof rmSync>;
const statSyncMock = statSync as jest.MockedFunction<typeof statSync>;
const globSyncMock = sync as jest.MockedFunction<typeof sync>;

function createConfiguration(
  assets: Required<Configuration>['compilerOptions']['assets'],
  allowOutsidePaths?: boolean,
): Required<Configuration> {
  return {
    monorepo: false,
    sourceRoot: 'src',
    entryFile: 'main',
    exec: '',
    projects: {},
    language: 'ts',
    collection: '@nestjs/schematics',
    compilerOptions: {
      assets,
      ...(allowOutsidePaths !== undefined && { allowOutsidePaths }),
    },
    generateOptions: {},
  };
}

describe('AssetsManager', () => {
  const sourceRoot = path.join(process.cwd(), 'src');
  const sourceFile = path.join(sourceRoot, 'asset.txt');

  beforeEach(() => {
    copyFileSyncMock.mockReset();
    mkdirSyncMock.mockReset();
    rmSyncMock.mockReset();
    statSyncMock.mockReset();
    globSyncMock.mockReset();

    statSyncMock.mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
    } as any);
    globSyncMock.mockReturnValue([sourceFile] as any);
  });

  describe('default behavior (allowOutsidePaths not set)', () => {
    it('should copy assets to an output directory inside the project', () => {
      const assetsManager = new AssetsManager();
      const configuration = createConfiguration(['**/*.txt']);

      assetsManager.copyAssets(configuration, undefined, 'dist', false);

      expect(mkdirSyncMock).toHaveBeenCalled();
      expect(copyFileSyncMock).toHaveBeenCalledWith(
        sourceFile,
        expect.stringContaining('asset.txt'),
      );
    });

    it('should allow copying assets to an output directory outside the project', () => {
      const assetsManager = new AssetsManager();
      const outDir = path.join('..', 'outside-assets');
      const configuration = createConfiguration([
        { glob: '**/*.txt', include: '**/*.txt', outDir },
      ]);

      expect(() =>
        assetsManager.copyAssets(configuration, undefined, 'dist', false),
      ).not.toThrow();
      expect(copyFileSyncMock).toHaveBeenCalled();
    });
  });

  describe('with allowOutsidePaths: true', () => {
    it('should allow copying assets to an outside directory', () => {
      const assetsManager = new AssetsManager();
      const outDir = path.join('..', 'outside-assets');
      const configuration = createConfiguration(
        [{ glob: '**/*.txt', include: '**/*.txt', outDir }],
        true,
      );

      expect(() =>
        assetsManager.copyAssets(configuration, undefined, 'dist', false),
      ).not.toThrow();
      expect(copyFileSyncMock).toHaveBeenCalled();
    });
  });

  describe('with allowOutsidePaths: false', () => {
    it('should copy assets to an output directory inside the project', () => {
      const assetsManager = new AssetsManager();
      const configuration = createConfiguration(['**/*.txt'], false);
      const dest = path.resolve(process.cwd(), 'dist', 'asset.txt');

      assetsManager.copyAssets(configuration, undefined, 'dist', false);

      expect(mkdirSyncMock).toHaveBeenCalledWith(path.dirname(dest), {
        recursive: true,
      });
      expect(copyFileSyncMock).toHaveBeenCalledWith(sourceFile, dest);
    });

    it('should copy assets to an absolute output directory inside the project', () => {
      const assetsManager = new AssetsManager();
      const outDir = path.resolve(process.cwd(), 'build-assets');
      const configuration = createConfiguration(
        [{ glob: '**/*.txt', include: '**/*.txt', outDir }],
        false,
      );
      const dest = path.join(outDir, 'asset.txt');

      assetsManager.copyAssets(configuration, undefined, 'dist', false);

      expect(mkdirSyncMock).toHaveBeenCalledWith(path.dirname(dest), {
        recursive: true,
      });
      expect(copyFileSyncMock).toHaveBeenCalledWith(sourceFile, dest);
    });

    it('should reject a relative output directory outside the project', () => {
      const assetsManager = new AssetsManager();
      const outDir = path.join('..', 'outside-assets');
      const configuration = createConfiguration(
        [{ glob: '**/*.txt', include: '**/*.txt', outDir }],
        false,
      );

      expect(() =>
        assetsManager.copyAssets(configuration, undefined, 'dist', false),
      ).toThrow(
        'An error occurred during the assets copying process. Refusing to process asset outside of or equal to the project directory:',
      );
      expect(mkdirSyncMock).not.toHaveBeenCalled();
      expect(copyFileSyncMock).not.toHaveBeenCalled();
      expect(rmSyncMock).not.toHaveBeenCalled();
    });

    it('should reject an absolute output directory outside the project', () => {
      const assetsManager = new AssetsManager();
      const outDir = path.resolve(process.cwd(), '..', 'outside-assets');
      const configuration = createConfiguration(
        [{ glob: '**/*.txt', include: '**/*.txt', outDir }],
        false,
      );

      expect(() =>
        assetsManager.copyAssets(configuration, undefined, 'dist', false),
      ).toThrow(
        'An error occurred during the assets copying process. Refusing to process asset outside of or equal to the project directory:',
      );
      expect(mkdirSyncMock).not.toHaveBeenCalled();
      expect(copyFileSyncMock).not.toHaveBeenCalled();
      expect(rmSyncMock).not.toHaveBeenCalled();
    });

    it('should remove watched assets from an output directory inside the project', () => {
      const assetsManager = new AssetsManager();
      const dest = path.resolve(process.cwd(), 'dist', 'asset.txt');
      (assetsManager as any).allowOutsidePaths = false;

      (assetsManager as any).actionOnFile({
        action: 'unlink',
        item: { outDir: 'dist' },
        path: sourceFile,
        sourceRoot,
        watchAssetsMode: true,
      });

      expect(rmSyncMock).toHaveBeenCalledWith(dest, { force: true });
    });

    it('should reject removing watched assets outside the project', () => {
      const assetsManager = new AssetsManager();
      const outDir = path.join('..', 'outside-assets');
      (assetsManager as any).allowOutsidePaths = false;

      expect(() =>
        (assetsManager as any).actionOnFile({
          action: 'unlink',
          item: { outDir },
          path: sourceFile,
          sourceRoot,
          watchAssetsMode: true,
        }),
      ).toThrow(
        'Refusing to process asset outside of or equal to the project directory:',
      );
      expect(rmSyncMock).not.toHaveBeenCalled();
    });
  });
});
