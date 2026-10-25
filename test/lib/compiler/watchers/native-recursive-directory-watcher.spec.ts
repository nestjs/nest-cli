import { basename, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  watchDirectoryRecursively,
  type RecursiveDirectoryWatcher,
} from '../../../../lib/compiler/watchers/recursive-directory-watcher.js';

const filesystem = vi.hoisted(() => ({
  watch: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  watch: filesystem.watch,
}));

vi.mock('fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs/promises')>()),
  readdir: filesystem.readdir,
  stat: filesystem.stat,
}));

describe('native recursive directory watcher events', () => {
  const platform = process.platform;
  const dir = join(process.cwd(), 'virtual-watcher');
  const file = join(dir, 'main.js');
  let files: Map<string, { mtimeMs: number; size: number }>;
  let notify: (event: string, filename: string) => void;
  let watcher: RecursiveDirectoryWatcher | undefined;
  const onAdd = vi.fn();
  const onChange = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Exercise the native path on Linux CI without requiring native fs.watch.
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    files = new Map([[file, { mtimeMs: 100, size: 16 }]]);
    filesystem.readdir.mockImplementation(async () =>
      [...files.keys()].map((path) => ({
        name: basename(path),
        parentPath: dir,
        isFile: () => true,
      })),
    );
    filesystem.stat.mockImplementation(async (path: string) => {
      if (path === dir) {
        return { isDirectory: () => true };
      }
      const snapshot = files.get(path);
      if (snapshot === undefined) {
        throw new Error('ENOENT');
      }
      return snapshot;
    });
    filesystem.watch.mockImplementation((_path, _options, listener) => {
      notify = listener;
      return { on: vi.fn(), close: vi.fn() };
    });
  });

  afterEach(async () => {
    await watcher?.close();
    watcher = undefined;
    Object.defineProperty(process, 'platform', { value: platform });
    vi.useRealTimers();
  });

  async function start() {
    watcher = await watchDirectoryRecursively(dir, {
      extensions: ['.js'],
      onAdd,
      onChange,
      stabilityThreshold: 20,
      pollInterval: 10,
    });
  }

  it('should ignore metadata-only events for an unchanged file', async () => {
    await start();

    notify('change', 'main.js');
    await vi.advanceTimersByTimeAsync(100);

    expect(onChange).not.toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should report same-size edits when the modification time changes', async () => {
    await start();

    files.set(file, { mtimeMs: 200, size: 16 });
    notify('change', 'main.js');
    await vi.advanceTimersByTimeAsync(100);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(file);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should report size changes even when the modification time is preserved', async () => {
    await start();

    files.set(file, { mtimeMs: 100, size: 32 });
    notify('change', 'main.js');
    await vi.advanceTimersByTimeAsync(100);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(file);
  });

  it('should not report the same file state twice', async () => {
    await start();

    files.set(file, { mtimeMs: 200, size: 16 });
    notify('change', 'main.js');
    await vi.advanceTimersByTimeAsync(100);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(file);

    notify('change', 'main.js');
    await vi.advanceTimersByTimeAsync(100);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(file);
  });

  it('should report newly added files', async () => {
    await start();
    const added = join(dir, 'added.js');

    files.set(added, { mtimeMs: 200, size: 16 });
    notify('rename', 'added.js');
    await vi.advanceTimersByTimeAsync(100);

    expect(onAdd).toHaveBeenCalledExactlyOnceWith(added);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should report a recreated file as an addition', async () => {
    await start();

    files.delete(file);
    notify('rename', 'main.js');
    await vi.advanceTimersByTimeAsync(40);

    files.set(file, { mtimeMs: 100, size: 16 });
    notify('rename', 'main.js');
    await vi.advanceTimersByTimeAsync(100);

    expect(onAdd).toHaveBeenCalledExactlyOnceWith(file);
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('with coarse modification times', () => {
    const now = 10_000;

    beforeEach(() => {
      vi.setSystemTime(now);
      // Written just before the watch started, e.g. by the initial build.
      files.set(file, { mtimeMs: now, size: 16 });
    });

    it('should report a recently modified file even if its snapshot is unchanged', async () => {
      await start();

      // A same-size edit within one mtime tick leaves the snapshot unchanged.
      notify('change', 'main.js');
      await vi.advanceTimersByTimeAsync(100);

      expect(onChange).toHaveBeenCalledExactlyOnceWith(file);
    });

    it('should not report recently modified files on catch-up scans', async () => {
      await start();

      await vi.advanceTimersByTimeAsync(2_000);

      expect(onChange).not.toHaveBeenCalled();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('should ignore an unchanged snapshot once its modification time is old enough', async () => {
      await start();
      await vi.advanceTimersByTimeAsync(3_000);

      notify('change', 'main.js');
      await vi.advanceTimersByTimeAsync(100);

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
