import { describe, expect, it } from 'vitest';
import { join, normalize, resolve } from 'path';
import { getEffectiveRootDir } from '../../../../lib/compiler/helpers/get-effective-root-dir.js';

describe('getEffectiveRootDir', () => {
  const cwd = '/project';

  describe('when rootDir is explicitly configured', () => {
    it('returns the absolute, normalized path of an absolute rootDir', () => {
      const result = getEffectiveRootDir('/project/src', undefined, cwd);
      expect(result).toBe(normalize('/project/src'));
    });

    it('resolves a relative rootDir against cwd', () => {
      const result = getEffectiveRootDir('./src', undefined, cwd);
      expect(result).toBe(normalize(resolve(cwd, 'src')));
    });

    it('ignores fileNames when rootDir is set', () => {
      const result = getEffectiveRootDir(
        '/project/src',
        ['/project/lib/a.ts', '/project/lib/b.ts'],
        cwd,
      );
      expect(result).toBe(normalize('/project/src'));
    });
  });

  describe('when rootDir is not set', () => {
    it('returns undefined for empty file list', () => {
      expect(getEffectiveRootDir(undefined, [], cwd)).toBeUndefined();
      expect(getEffectiveRootDir(undefined, undefined, cwd)).toBeUndefined();
    });

    it('returns the file directory when only one file is given', () => {
      const result = getEffectiveRootDir(
        undefined,
        ['/project/src/main.ts'],
        cwd,
      );
      expect(result).toBe(normalize('/project/src'));
    });

    it('computes the longest common parent dir for multiple files', () => {
      const result = getEffectiveRootDir(
        undefined,
        ['/project/src/a/foo.ts', '/project/src/b/bar.ts'],
        cwd,
      );
      expect(result).toBe(normalize('/project/src'));
    });

    it('returns a deeper common dir when all files share it', () => {
      const result = getEffectiveRootDir(
        undefined,
        [
          '/project/src/feature/x.ts',
          '/project/src/feature/y.ts',
          '/project/src/feature/sub/z.ts',
        ],
        cwd,
      );
      expect(result).toBe(normalize('/project/src/feature'));
    });

    it('resolves relative file paths against cwd before computing common dir', () => {
      const result = getEffectiveRootDir(
        undefined,
        ['src/a.ts', 'src/nested/b.ts'],
        cwd,
      );
      expect(result).toBe(normalize(resolve(cwd, 'src')));
    });
  });
});
