import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { platform, tmpdir } from 'os';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  globEntriesSync,
  globSync,
} from '../../../../lib/compiler/helpers/glob.js';

describe('globSync', () => {
  let root: string;
  const rel = (paths: string[]) => paths.map((p) => p.replace(root, '')).sort();

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'nest-glob-')).replace(/\\/g, '/');
    mkdirSync(join(root, 'src/assets/nested'), { recursive: true });
    mkdirSync(join(root, 'src/.hidden'), { recursive: true });
    mkdirSync(join(root, 'src/emptydir'), { recursive: true });
    writeFileSync(join(root, 'src/top.hbs'), 'top');
    writeFileSync(join(root, 'src/assets/a.hbs'), 'a');
    writeFileSync(join(root, 'src/assets/.dotfile.hbs'), 'dot');
    writeFileSync(join(root, 'src/assets/nested/b.hbs'), 'b');
    writeFileSync(join(root, 'src/.hidden/d.hbs'), 'd');
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  describe('dot handling', () => {
    it('includes dotfiles for a wildcard when dot is true', () => {
      expect(rel(globSync(`${root}/src/assets/*`, { dot: true }))).toEqual([
        '/src/assets/.dotfile.hbs',
        '/src/assets/a.hbs',
        '/src/assets/nested',
      ]);
    });

    it('excludes dotfiles for a wildcard when dot is false', () => {
      expect(rel(globSync(`${root}/src/assets/*`, { dot: false }))).toEqual([
        '/src/assets/a.hbs',
        '/src/assets/nested',
      ]);
    });

    it('defaults dot to false when omitted', () => {
      expect(rel(globSync(`${root}/src/assets/*`))).toEqual([
        '/src/assets/a.hbs',
        '/src/assets/nested',
      ]);
    });

    it('matches dot entries through a globstar when dot is true', () => {
      expect(rel(globSync(`${root}/src/**/*.hbs`, { dot: true }))).toEqual([
        '/src/.hidden/d.hbs',
        '/src/assets/.dotfile.hbs',
        '/src/assets/a.hbs',
        '/src/assets/nested/b.hbs',
        '/src/top.hbs',
      ]);
    });

    it('matches an explicit dot pattern regardless of the dot option', () => {
      expect(rel(globSync(`${root}/src/assets/.*`, { dot: false }))).toEqual([
        '/src/assets/.dotfile.hbs',
      ]);
    });
  });

  describe('pattern forms', () => {
    it('returns a literal directory path unchanged', () => {
      expect(rel(globSync(`${root}/src/assets`, { dot: true }))).toEqual([
        '/src/assets',
      ]);
    });

    it('returns a literal file path unchanged', () => {
      expect(rel(globSync(`${root}/src/top.hbs`, { dot: true }))).toEqual([
        '/src/top.hbs',
      ]);
    });

    it('matches the base itself for a trailing globstar', () => {
      expect(rel(globSync(`${root}/src/assets/**`, { dot: true }))).toEqual([
        '/src/assets',
        '/src/assets/.dotfile.hbs',
        '/src/assets/a.hbs',
        '/src/assets/nested',
        '/src/assets/nested/b.hbs',
      ]);
    });

    it('supports brace expansion', () => {
      expect(
        rel(globSync(`${root}/src/{assets,emptydir}/*`, { dot: false })),
      ).toEqual(['/src/assets/a.hbs', '/src/assets/nested']);
    });

    it('supports a single-segment wildcard between literals', () => {
      expect(rel(globSync(`${root}/src/*/*.hbs`, { dot: false }))).toEqual([
        '/src/assets/a.hbs',
      ]);
    });

    it('returns directories as well as files', () => {
      expect(rel(globSync(`${root}/src/*`, { dot: false }))).toEqual([
        '/src/assets',
        '/src/emptydir',
        '/src/top.hbs',
      ]);
    });
  });

  describe('ignore handling', () => {
    it('drops matches under an ignored globstar', () => {
      expect(
        rel(
          globSync(`${root}/src/**/*.hbs`, {
            dot: true,
            ignore: `${root}/src/assets/**`,
          }),
        ),
      ).toEqual(['/src/.hidden/d.hbs', '/src/top.hbs']);
    });

    it('prunes the ignored directory itself, not only its contents', () => {
      expect(
        rel(
          globSync(`${root}/src/assets/**/*`, {
            dot: true,
            ignore: `${root}/src/assets/nested/**`,
          }),
        ),
      ).toEqual(['/src/assets/.dotfile.hbs', '/src/assets/a.hbs']);
    });

    it('drops an exact literal ignore match', () => {
      expect(
        rel(
          globSync(`${root}/src/*`, {
            dot: true,
            ignore: `${root}/src/.hidden`,
          }),
        ),
      ).toEqual(['/src/assets', '/src/emptydir', '/src/top.hbs']);
    });
  });

  describe('missing paths', () => {
    it('returns an empty array when the base directory does not exist', () => {
      expect(globSync(`${root}/src/nonexistent/**/*`, { dot: true })).toEqual(
        [],
      );
    });

    it('returns an empty array for a literal path that does not exist', () => {
      expect(globSync(`${root}/src/nonexistent.txt`, { dot: true })).toEqual(
        [],
      );
    });

    it('returns an empty array for an empty directory', () => {
      expect(globSync(`${root}/src/emptydir/*`, { dot: true })).toEqual([]);
    });
  });

  describe('globEntriesSync', () => {
    it('reports the type of each match', () => {
      const entries = globEntriesSync(`${root}/src/*`, { dot: false }).sort(
        (a, b) => a.path.localeCompare(b.path),
      );
      expect(
        entries.map((e) => ({
          path: e.path.replace(root, ''),
          isFile: e.isFile,
          isDirectory: e.isDirectory,
        })),
      ).toEqual([
        { path: '/src/assets', isFile: false, isDirectory: true },
        { path: '/src/emptydir', isFile: false, isDirectory: true },
        { path: '/src/top.hbs', isFile: true, isDirectory: false },
      ]);
    });

    it('reports a literal directory as a directory', () => {
      expect(globEntriesSync(`${root}/src/assets`, { dot: true })).toEqual([
        { path: `${root}/src/assets`, isFile: false, isDirectory: true },
      ]);
    });
  });

  describe('regression: narrow MAGIC_CHARS', () => {
    it('finds files under a path segment containing "@"', () => {
      mkdirSync(join(root, 'users/user@latam.com/src'), { recursive: true });
      writeFileSync(join(root, 'users/user@latam.com/src/app.hbs'), 'app');

      expect(
        rel(globSync(`${root}/users/user@latam.com/src/**/*.hbs`)),
      ).toEqual(['/users/user@latam.com/src/app.hbs']);
    });

    it('finds files under a path segment containing "(x86)"', () => {
      mkdirSync(join(root, 'Program Files (x86)/@scope/src'), {
        recursive: true,
      });
      writeFileSync(
        join(root, 'Program Files (x86)/@scope/src/app.hbs'),
        'app',
      );

      expect(
        rel(globSync(`${root}/Program Files (x86)/@scope/src/**/*.hbs`)),
      ).toEqual(['/Program Files (x86)/@scope/src/app.hbs']);
    });
  });

  describe('regression: symlinked directories are not followed', () => {
    let symlinkRoot: string;

    beforeAll(() => {
      symlinkRoot = join(root, 'symtree');
      mkdirSync(join(symlinkRoot, 'real'), { recursive: true });
      writeFileSync(join(symlinkRoot, 'real/leaf.hbs'), 'leaf');

      // A symlinked directory that cycles back to its own parent. Following
      // it would recurse forever; the fix must list it as an entry without
      // ever descending into `loop/real` or `loop/loop`.
      try {
        symlinkSync(symlinkRoot, join(symlinkRoot, 'loop'), 'dir');
      } catch {
        // Creating symlinks can require elevated privileges on Windows;
        // skip silently there rather than failing the whole run.
      }
    });

    it('does not follow a symlinked directory (no infinite loop, no double count)', () => {
      if (platform() === 'win32') {
        return;
      }

      const matches = rel(globSync(`${symlinkRoot}/**/*.hbs`));

      // Only the real file is matched; nothing is found through `loop`,
      // because the walk lists `loop`'s immediate children but never
      // descends into `loop/real` or `loop/loop`.
      expect(matches).toEqual(['/symtree/real/leaf.hbs']);
    });
  });

  describe('regression: how far a pattern reaches past a symlink', () => {
    let linkRoot: string;
    let supported = true;

    beforeAll(() => {
      linkRoot = join(root, 'linktree');
      mkdirSync(join(linkRoot, 'real'), { recursive: true });
      mkdirSync(join(linkRoot, 'assets'), { recursive: true });
      writeFileSync(join(linkRoot, 'real/x.hbs'), 'x');
      writeFileSync(join(linkRoot, 'assets/y.hbs'), 'y');

      try {
        symlinkSync(
          join(linkRoot, 'real'),
          join(linkRoot, 'assets/link'),
          'dir',
        );
      } catch {
        supported = false;
      }
    });

    // A globstar stops AT a symlinked directory, but the explicit segments
    // after it keep matching normally — so `assets/**` must not reach through
    // `link`, while `assets/**/*` reaches exactly one level in.
    it('a trailing globstar stops at the symlink itself', () => {
      if (platform() === 'win32' || !supported) {
        return;
      }

      expect(rel(globSync(`${linkRoot}/assets/**`, { dot: true }))).toEqual([
        '/linktree/assets',
        '/linktree/assets/link',
        '/linktree/assets/y.hbs',
      ]);
    });

    it('an explicit segment after the globstar reaches one level in', () => {
      if (platform() === 'win32' || !supported) {
        return;
      }

      expect(rel(globSync(`${linkRoot}/assets/**/*`, { dot: true }))).toEqual([
        '/linktree/assets/link',
        '/linktree/assets/link/x.hbs',
        '/linktree/assets/y.hbs',
      ]);
    });
  });

  describe('regression: partial results on an unreadable subdirectory', () => {
    it('still returns matches found outside the unreadable directory', () => {
      // chmod-based permission denial has no effect when running as root.
      if (platform() === 'win32' || process.getuid?.() === 0) {
        return;
      }

      const unreadableRoot = join(root, 'partial');
      mkdirSync(join(unreadableRoot, 'ok'), { recursive: true });
      mkdirSync(join(unreadableRoot, 'blocked'), { recursive: true });
      writeFileSync(join(unreadableRoot, 'ok/keep.hbs'), 'keep');
      writeFileSync(join(unreadableRoot, 'blocked/hidden.hbs'), 'hidden');

      chmodSync(join(unreadableRoot, 'blocked'), 0o000);

      try {
        expect(rel(globSync(`${unreadableRoot}/**/*.hbs`))).toEqual([
          '/partial/ok/keep.hbs',
        ]);
      } finally {
        // Restore permissions so `afterAll`'s recursive rmSync can clean up.
        chmodSync(join(unreadableRoot, 'blocked'), 0o755);
      }
    });
  });
});
