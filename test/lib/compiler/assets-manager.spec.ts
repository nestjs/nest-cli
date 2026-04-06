import { EventEmitter } from 'events';
import { AssetsManager } from '../../../lib/compiler/assets-manager';

// Mock all dependencies
jest.mock('chokidar', () => ({
  watch: jest.fn(),
}));
jest.mock('glob', () => ({
  sync: jest.fn(),
}));
jest.mock('fs', () => ({
  copyFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  statSync: jest.fn(),
}));
jest.mock('../../../lib/compiler/helpers/copy-path-resolve', () => ({
  copyPathResolve: jest.fn().mockReturnValue('/dest/file.txt'),
}));
jest.mock('../../../lib/compiler/helpers/get-value-or-default', () => ({
  getValueOrDefault: jest.fn(),
}));

import * as chokidar from 'chokidar';
import { sync as globSync } from 'glob';
import { copyFileSync, mkdirSync } from 'fs';
import { getValueOrDefault } from '../../../lib/compiler/helpers/get-value-or-default';

describe('AssetsManager', () => {
  let assetsManager: AssetsManager;

  beforeEach(() => {
    assetsManager = new AssetsManager();
    jest.clearAllMocks();
  });

  describe('closeWatchers', () => {
    it('should wait for all watchers to be ready before closing them', async () => {
      // Simulate a watcher that takes time to become ready
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = jest.fn();

      (chokidar.watch as jest.Mock).mockReturnValue(mockWatcher);
      (globSync as unknown as jest.Mock).mockReturnValue(['/src/file.hbs']);
      (getValueOrDefault as jest.Mock)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }]) // assets
        .mockReturnValueOnce('src') // sourceRoot
        .mockReturnValueOnce(false); // compilerOptions.watchAssets

      assetsManager.copyAssets(
        {} as any,
        undefined,
        'dist',
        false,
      );

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
      mockWatcher.close = jest.fn();

      (chokidar.watch as jest.Mock).mockReturnValue(mockWatcher);
      (globSync as unknown as jest.Mock).mockReturnValue(['/src/file.hbs']);
      (getValueOrDefault as jest.Mock)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets(
        {} as any,
        undefined,
        'dist',
        false,
      );

      // Emit ready before calling closeWatchers
      mockWatcher.emit('ready');
      await new Promise((resolve) => setImmediate(resolve));

      assetsManager.closeWatchers();
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });

    it('should wait for multiple watchers to all be ready', async () => {
      const mockWatcher1 = new EventEmitter() as any;
      mockWatcher1.close = jest.fn();
      const mockWatcher2 = new EventEmitter() as any;
      mockWatcher2.close = jest.fn();

      (chokidar.watch as jest.Mock)
        .mockReturnValueOnce(mockWatcher1)
        .mockReturnValueOnce(mockWatcher2);
      (globSync as unknown as jest.Mock).mockReturnValue(['/src/file.hbs']);
      (getValueOrDefault as jest.Mock)
        .mockReturnValueOnce([
          { include: '**/*.hbs', watchAssets: true },
          { include: '**/*.html', watchAssets: true },
        ])
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      assetsManager.copyAssets(
        {} as any,
        undefined,
        'dist',
        false,
      );

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

    it('should handle no watchers gracefully', async () => {
      // closeWatchers with no watchers should not throw
      assetsManager.closeWatchers();
      await new Promise((resolve) => setImmediate(resolve));
      // No error thrown = success
    });

    it('should ensure all add events fire before watcher is closed', async () => {
      const addedFiles: string[] = [];
      const mockWatcher = new EventEmitter() as any;
      mockWatcher.close = jest.fn();

      (chokidar.watch as jest.Mock).mockReturnValue(mockWatcher);
      (globSync as unknown as jest.Mock).mockReturnValue([
        '/src/a.hbs',
        '/src/b.hbs',
        '/src/c.hbs',
      ]);
      (getValueOrDefault as jest.Mock)
        .mockReturnValueOnce([{ include: '**/*.hbs', watchAssets: true }])
        .mockReturnValueOnce('src')
        .mockReturnValueOnce(false);

      // Track calls to copyFileSync to verify files are copied
      (copyFileSync as jest.Mock).mockImplementation(() => {
        addedFiles.push('copied');
      });

      assetsManager.copyAssets(
        {} as any,
        undefined,
        'dist',
        false,
      );

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
});
