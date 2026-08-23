import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
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
});
