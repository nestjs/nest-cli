import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  supportsNativeRecursiveWatch,
  watchDirectoryRecursively,
  type RecursiveDirectoryWatcher,
} from '../../../../lib/compiler/watchers/recursive-directory-watcher.js';

// Generous, because these run against the real file system alongside the rest
// of the suite; the assertion has to be able to fail before the test times out.
const TEST_TIMEOUT = 20_000;

const waitFor = async (assertion: () => void, timeout = 10_000) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      assertion();
      return;
    } catch (err) {
      if (Date.now() > deadline) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
};

describe('recursive directory watcher', () => {
  let dir: string;
  let watcher: RecursiveDirectoryWatcher | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'nest-cli-watcher-'));
  });

  afterEach(async () => {
    await watcher?.close();
    watcher = undefined;
    rmSync(dir, { recursive: true, force: true });
  });

  describe('supportsNativeRecursiveWatch', () => {
    it('should use the native recursive watch where libuv implements it', () => {
      expect(supportsNativeRecursiveWatch('darwin')).toBe(true);
      expect(supportsNativeRecursiveWatch('win32')).toBe(true);
    });

    it('should fall back to chokidar on the other platforms', () => {
      expect(supportsNativeRecursiveWatch('linux')).toBe(false);
      expect(supportsNativeRecursiveWatch('aix')).toBe(false);
    });
  });

  it(
    'should report files added to a nested directory',
    async () => {
      const onAdd = vi.fn();
      watcher = await watchDirectoryRecursively(dir, {
        extensions: ['.ts'],
        onAdd,
      });

      mkdirSync(join(dir, 'modules'));
      writeFileSync(join(dir, 'modules/foo.ts'), 'export const foo = 1;\n');

      await waitFor(() =>
        expect(onAdd).toHaveBeenCalledWith(join(dir, 'modules/foo.ts')),
      );
    },
    TEST_TIMEOUT,
  );

  it(
    'should not report files that already existed when the watch started',
    async () => {
      writeFileSync(join(dir, 'existing.ts'), 'export const a = 1;\n');

      const onAdd = vi.fn();
      watcher = await watchDirectoryRecursively(dir, {
        extensions: ['.ts'],
        onAdd,
      });

      writeFileSync(join(dir, 'added.ts'), 'export const b = 1;\n');

      await waitFor(() =>
        expect(onAdd).toHaveBeenCalledWith(join(dir, 'added.ts')),
      );
      expect(onAdd).not.toHaveBeenCalledWith(join(dir, 'existing.ts'));
    },
    TEST_TIMEOUT,
  );

  it(
    'should report a modification of a known file as a change',
    async () => {
      const file = join(dir, 'main.js');
      writeFileSync(file, 'console.log(1);\n');

      const onAdd = vi.fn();
      const onChange = vi.fn();
      watcher = await watchDirectoryRecursively(dir, {
        extensions: ['.js', '.mjs'],
        onAdd,
        onChange,
      });

      writeFileSync(file, 'console.log(2);\n');

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
      expect(onAdd).not.toHaveBeenCalled();
    },
    TEST_TIMEOUT,
  );

  it(
    'should not report files with a non-matching extension',
    async () => {
      const onAdd = vi.fn();
      watcher = await watchDirectoryRecursively(dir, {
        extensions: ['.ts'],
        onAdd,
      });

      writeFileSync(join(dir, 'data.json'), '{}\n');
      writeFileSync(join(dir, 'app.ts'), 'export const a = 1;\n');

      await waitFor(() =>
        expect(onAdd).toHaveBeenCalledWith(join(dir, 'app.ts')),
      );
      expect(onAdd).not.toHaveBeenCalledWith(join(dir, 'data.json'));
    },
    TEST_TIMEOUT,
  );

  it(
    'should stop reporting once closed',
    async () => {
      const onAdd = vi.fn();
      watcher = await watchDirectoryRecursively(dir, {
        extensions: ['.ts'],
        onAdd,
      });
      await watcher.close();
      watcher = undefined;

      writeFileSync(join(dir, 'app.ts'), 'export const a = 1;\n');
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(onAdd).not.toHaveBeenCalled();
    },
    TEST_TIMEOUT,
  );

  it.runIf(supportsNativeRecursiveWatch())(
    'should re-arm after the watched directory is removed and recreated',
    async () => {
      const onAdd = vi.fn();
      watcher = await watchDirectoryRecursively(dir, {
        extensions: ['.js'],
        onAdd,
      });

      rmSync(dir, { recursive: true, force: true });
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'main.js'), 'console.log(1);\n');

      await waitFor(() =>
        expect(onAdd).toHaveBeenCalledWith(join(dir, 'main.js')),
      );
    },
    TEST_TIMEOUT,
  );
});
