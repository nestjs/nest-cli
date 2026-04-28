import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { copyFileSync, statSync} from 'fs';
import { sync as globSync } from 'glob';
import { join, sep } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetsManager } from '../../../lib/compiler/assets-manager.js';
import { copyPathResolve } from '../../../lib/compiler/helpers/copy-path-resolve.js';
import { getValueOrDefault } from '../../../lib/compiler/helpers/get-value-or-default.js';

vi.mock('chokidar', () => ({
  watch: vi.fn(),
}));

vi.mock('glob', () => ({
  sync: vi.fn(),
}));

vi.mock('fs', () => ({
  copyFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  statSync: vi.fn(() => ({ isFile: () => true, isDirectory: () => false })),
}));

vi.mock('../../../lib/compiler/helpers/copy-path-resolve.js', () => ({
  copyPathResolve: vi.fn().mockReturnValue('/dest/file.txt'),
}));

vi.mock('../../../lib/compiler/helpers/get-value-or-default.js', () => ({
  getValueOrDefault: vi.fn(),
}));

describe('AssetsManager', () => {
  let assetsManager: AssetsManager;

  beforeEach(() => {
    assetsManager = new AssetsManager();
    vi.clearAllMocks();
  });

  describe('closeWatchers', () => {
    it('should wait for all watchers to be ready before closing them', async () => {
      // Simulate a watcher that takes time to become ready
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }]) // assets
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src') // sourceRoot
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      // Call closeWatchers before watcher is ready
      assetsManager.closeWatchers();

      // Watcher should NOT have been closed yet
      expect(mockWatcher.close).not.toHaveBeenCalled();

      // Now emit ready event (simulating chokidar finishing initial scan)
      mockWatcher.emit('ready');

      // Allow promise microtask to resolve
      await new Promise((resolve) => setImmediate(resolve));

      // Now the watcher should be closed
      expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });

    it('should close watchers immediately if they are already ready', async () => {
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      // Emit ready before calling closeWatchers
      mockWatcher.emit('ready');
      await new Promise((resolve) => setImmediate(resolve));

      assetsManager.closeWatchers();
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });

    it('should wait for multiple watchers to all be ready', async () => {
      const mockWatcher1 = new EventEmitter() as any;
      mockWatcher1.close = vi.fn();
      const mockWatcher2 = new EventEmitter() as any;
      mockWatcher2.close = vi.fn();

      vi.mocked(chokidar.watch)
        .mockReturnValueOnce(mockWatcher1)
        .mockReturnValueOnce(mockWatcher2);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([
          { include: '**/*.hbs', watchAssets: true },
          { include: '**/*.html', watchAssets: true },
        ])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      assetsManager.closeWatchers();

      // Only first watcher is ready
      mockWatcher1.emit('ready');
      await new Promise((resolve) => setImmediate(resolve));

      // Neither should be closed yet since watcher2 is not ready
      expect(mockWatcher1.close).not.toHaveBeenCalled();
      expect(mockWatcher2.close).not.toHaveBeenCalled();

      // Now second watcher is ready
      mockWatcher2.emit('ready');
      await new Promise((resolve) => setImmediate(resolve));

      // Both should now be closed
      expect(mockWatcher1.close).toHaveBeenCalledTimes(1);
      expect(mockWatcher2.close).toHaveBeenCalledTimes(1);
    });

    it('should handle no watchers gracefully (closeWatchers)', async () => {
      // closeWatchers with no watchers should not throw
      assetsManager.closeWatchers();
      await new Promise((resolve) => setImmediate(resolve));
      // No error thrown = success
    });
  });

  describe('onSuccess callback on asset change', () => {
    it('should call onSuccess when a watched asset changes after watcher is ready', async () => {
      vi.useFakeTimers();
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();
      const onSuccess = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false, onSuccess);

      // Simulate initial add (before ready) - should NOT call onSuccess
      mockWatcher.emit('add', '/src/file.hbs');
      await vi.runAllTimersAsync();
      expect(onSuccess).not.toHaveBeenCalled();

      // Emit ready
      mockWatcher.emit('ready');

      // Simulate change after ready - should call onSuccess (after debounce)
      mockWatcher.emit('change', '/src/file.hbs');
      await vi.runAllTimersAsync();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should call onSuccess when a new asset is added after watcher is ready', async () => {
      vi.useFakeTimers();
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();
      const onSuccess = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false, onSuccess);

      mockWatcher.emit('ready');

      // Simulate add after ready - should call onSuccess (after debounce)
      mockWatcher.emit('add', '/src/new-file.hbs');
      await vi.runAllTimersAsync();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should call onSuccess when an asset is deleted after watcher is ready', async () => {
      vi.useFakeTimers();
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();
      const onSuccess = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false, onSuccess);

      mockWatcher.emit('add', '/src/file.hbs');
      mockWatcher.emit('ready');

      // Simulate unlink after ready - should call onSuccess (after debounce)
      mockWatcher.emit('unlink', '/src/file.hbs');
      await vi.runAllTimersAsync();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should debounce rapid onSuccess calls into a single invocation', async () => {
      vi.useFakeTimers();
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();
      const onSuccess = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false, onSuccess);

      mockWatcher.emit('ready');

      // Burst of changes — should collapse into a single onSuccess call
      mockWatcher.emit('change', '/src/a.hbs');
      mockWatcher.emit('change', '/src/b.hbs');
      mockWatcher.emit('add', '/src/c.hbs');
      mockWatcher.emit('unlink', '/src/a.hbs');
      await vi.runAllTimersAsync();

      expect(onSuccess).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should not call onSuccess if no callback is provided', async () => {
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue(['/src/file.hbs']);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      // No onSuccess provided
      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      mockWatcher.emit('ready');

      // Should not throw when change occurs without onSuccess
      expect(() => mockWatcher.emit('change', '/src/file.hbs')).not.toThrow();
    });

    it('should not stall when asset glob matches no files', async () => {
      // Chokidar does not emit 'ready' when given an empty array,
      // which caused closeWatchers() to hang forever.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(globSync).mockReturnValue([]);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([
          { include: 'does-not-exist/**/*', watchAssets: true },
        ])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      // No watcher should have been created for the empty glob
      expect(chokidar.watch).not.toHaveBeenCalled();

      // A warning should have been logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('does-not-exist/**/*'),
      );

      // closeWatchers should resolve immediately since no watchers exist
      await assetsManager.closeWatchers();

      warnSpy.mockRestore();
    });

    it('should ensure all add events fire before watcher is closed', async () => {
      const addedFiles: string[] = [];
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = vi.fn();

      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher);
      vi.mocked(globSync).mockReturnValue([
        '/src/a.hbs',
        '/src/b.hbs',
        '/src/c.hbs',
      ]);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      // Track calls to copyFileSync to verify files are copied
      vi.mocked(copyFileSync).mockImplementation(() => {
        addedFiles.push('copied');
      });

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      // Request close before any add events
      assetsManager.closeWatchers();

      // Simulate chokidar emitting add events for each file
      mockWatcher.emit('add', '/src/a.hbs');
      mockWatcher.emit('add', '/src/b.hbs');
      mockWatcher.emit('add', '/src/c.hbs');

      // Watcher should still be open
      expect(mockWatcher.close).not.toHaveBeenCalled();

      // All files should have been copied
      expect(addedFiles).toHaveLength(3);

      // Now emit ready (chokidar does this after initial scan)
      mockWatcher.emit('ready');
      await new Promise((resolve) => setImmediate(resolve));

      // Now close should have been called
      expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('includeLibraryAssets', () => {
    it('should copy library assets when includeLibraryAssets references a library', () => {
      const configuration = {
        projects: {
          'my-lib': {
            type: 'library',
            root: 'libs/my-lib',
            sourceRoot: 'libs/my-lib/src',
            compilerOptions: {
              assets: ['**/*.graphql'],
            },
          },
        },
      } as any;

      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([]) // app assets (empty)
        .mockReturnValueOnce(['my-lib']) // includeLibraryAssets
        .mockReturnValueOnce('apps/my-app/src') // sourceRoot
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      (globSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
      const statMock = statSync as ReturnType<typeof vi.fn>;
      statMock.mockReturnValue({ isFile: () => true, isDirectory: () => false });

      assetsManager.copyAssets(configuration, 'my-app', 'dist', false);

      // The method should not throw and should process the library assets
      // Since globSync returns empty, no files are copied, but the flow completes
      expect(getValueOrDefault).toHaveBeenCalledTimes(4);
    });

    it('should copy library assets alongside app assets', () => {
      const configuration = {
        projects: {
          'shared-lib': {
            type: 'library',
            root: 'libs/shared-lib',
            sourceRoot: 'libs/shared-lib/src',
            compilerOptions: {
              assets: ['**/*.proto'],
            },
          },
        },
      } as any;

      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(['**/*.hbs']) // app assets
        .mockReturnValueOnce(['shared-lib']) // includeLibraryAssets
        .mockReturnValueOnce('apps/my-app/src') // sourceRoot
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      const matchedFiles = ['/cwd/libs/shared-lib/src/schema.proto'];
      (globSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(matchedFiles);
      const statMock = statSync as ReturnType<typeof vi.fn>;
      statMock.mockReturnValue({ isFile: () => true, isDirectory: () => false });

      assetsManager.copyAssets(configuration, 'my-app', 'dist', false);

      // copyFileSync should be called for both app and library assets
      expect(copyFileSync).toHaveBeenCalled();
    });

    it('should skip non-existent library names gracefully', () => {
      const configuration = {
        projects: {
          'existing-lib': {
            type: 'library',
            root: 'libs/existing-lib',
            sourceRoot: 'libs/existing-lib/src',
            compilerOptions: {
              assets: ['**/*.json'],
            },
          },
        },
      } as any;

      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([]) // app assets (empty)
        .mockReturnValueOnce(['non-existent-lib']); // includeLibraryAssets - does not exist

      // With no assets from either app or valid library, copyAssets returns early
      // (collectLibraryAssets returns [] because lib not found)
      expect(() =>
        assetsManager.copyAssets(configuration, 'my-app', 'dist', false),
      ).not.toThrow();
    });

    it('should skip library with no assets configured', () => {
      const configuration = {
        projects: {
          'no-assets-lib': {
            type: 'library',
            root: 'libs/no-assets-lib',
            sourceRoot: 'libs/no-assets-lib/src',
            compilerOptions: {},
          },
        },
      } as any;

      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([]) // app assets (empty)
        .mockReturnValueOnce(['no-assets-lib']); // includeLibraryAssets

      // Library has no assets configured, so collectLibraryAssets returns []
      // Both assets and libraryAssets are empty, so copyAssets returns early
      expect(() =>
        assetsManager.copyAssets(configuration, 'my-app', 'dist', false),
      ).not.toThrow();
    });

    it('should not include library assets when includeLibraryAssets is not set', () => {
      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([]) // app assets (empty)
        .mockReturnValueOnce([]); // includeLibraryAssets (empty)

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      // Should return early without calling sourceRoot or watchAssets
      expect(getValueOrDefault).toHaveBeenCalledTimes(2);
      expect(copyFileSync).not.toHaveBeenCalled();
    });

    it('should use library sourceRoot to resolve asset paths', () => {
      const configuration = {
        projects: {
          'my-lib': {
            type: 'library',
            root: 'libs/my-lib',
            sourceRoot: 'libs/my-lib/src',
            compilerOptions: {
              assets: [{ include: '**/*.graphql', exclude: '**/*.test.graphql' }],
            },
          },
        },
      } as any;

      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([]) // app assets (empty)
        .mockReturnValueOnce(['my-lib']) // includeLibraryAssets
        .mockReturnValueOnce('apps/my-app/src') // sourceRoot
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      const cwd = process.cwd();
      const expectedGlob = (cwd + '/libs/my-lib/src/**/*.graphql').replace(
        /\\/g,
        '/',
      );
      const expectedExclude = (
        cwd + '/libs/my-lib/src/**/*.test.graphql'
      ).replace(/\\/g, '/');

      (globSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);

      assetsManager.copyAssets(configuration, 'my-app', 'dist', false);

      // Verify glob was called with library-resolved paths
      expect(globSync).toHaveBeenCalledWith(expectedGlob, {
        ignore: expectedExclude,
        dot: true,
      });
    });
  });

  describe('rootDir-aware path stripping (#3387)', () => {
    it('strips against the supplied tsconfig rootDir instead of sourceRoot', () => {
      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([{ include: '**/*.txt' }]) // assets
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('app') // sourceRoot (legacy / wrong for this build)
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      (globSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
        '/abs/asset.txt',
      ]);

      const rootDir = join(process.cwd(), 'src');
      assetsManager.copyAssets(
        {} as any,
        undefined,
        'dist',
        false,
        undefined,
        rootDir,
      );

      // copyPathResolve must receive the rootDir-derived depth, not sourceRoot.
      expect(copyPathResolve).toHaveBeenCalledWith(
        '/abs/asset.txt',
        'dist',
        rootDir.split(sep).length,
      );
    });

    it('falls back to sourceRoot when rootDir is undefined', () => {
      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([{ include: '**/*.txt' }]) // assets
        .mockReturnValueOnce([]) // includeLibraryAssets
        .mockReturnValueOnce('app') // sourceRoot
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      (globSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
        '/abs/asset.txt',
      ]);

      assetsManager.copyAssets({} as any, undefined, 'dist', false);

      const expectedSourceRoot = join(process.cwd(), 'app');
      expect(copyPathResolve).toHaveBeenCalledWith(
        '/abs/asset.txt',
        'dist',
        expectedSourceRoot.split(sep).length,
      );
    });

    it('still uses each library asset _sourceRoot even when rootDir is set', () => {
      const configuration = {
        projects: {
          'my-lib': {
            type: 'library',
            root: 'libs/my-lib',
            sourceRoot: 'libs/my-lib/src',
            compilerOptions: {
              assets: [{ include: '**/*.graphql' }],
            },
          },
        },
      } as any;

      (getValueOrDefault as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce([]) // app assets (empty)
        .mockReturnValueOnce(['my-lib']) // includeLibraryAssets
        .mockReturnValueOnce('apps/my-app/src') // sourceRoot (unused for the lib path)
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      (globSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
        '/abs/lib/file.graphql',
      ]);

      const rootDir = join(process.cwd(), 'apps/my-app/src');
      assetsManager.copyAssets(
        configuration,
        'my-app',
        'dist',
        false,
        undefined,
        rootDir,
      );

      const expectedLibSourceRoot = join(process.cwd(), 'libs/my-lib/src');
      // Library entry must keep its own _sourceRoot, not be replaced by rootDir.
      expect(copyPathResolve).toHaveBeenCalledWith(
        '/abs/lib/file.graphql',
        'dist',
        expectedLibSourceRoot.split(sep).length,
      );
    });
  });
});
