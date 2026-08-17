import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  areOutsidePathsAllowed,
  assertPathInsideProject,
} from '../../../../lib/compiler/helpers/path-confinement.js';
import { Configuration } from '../../../../lib/configuration/index.js';

function createConfiguration(
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
      ...(allowOutsidePaths === undefined ? {} : { allowOutsidePaths }),
    },
    generateOptions: {},
  };
}

describe('areOutsidePathsAllowed', () => {
  it('should confine paths to the project by default', () => {
    expect(areOutsidePathsAllowed(createConfiguration(), undefined)).toBe(
      false,
    );
  });

  it('should confine paths to the project when explicitly disabled', () => {
    expect(areOutsidePathsAllowed(createConfiguration(false), undefined)).toBe(
      false,
    );
  });

  it('should allow outside paths when explicitly enabled', () => {
    expect(areOutsidePathsAllowed(createConfiguration(true), undefined)).toBe(
      true,
    );
  });

  it('should read the per-project value in a monorepo', () => {
    const configuration = createConfiguration();
    configuration.projects = {
      'my-app': { compilerOptions: { allowOutsidePaths: true } },
    } as any;

    expect(areOutsidePathsAllowed(configuration, 'my-app')).toBe(true);
    expect(areOutsidePathsAllowed(configuration, 'other-app')).toBe(false);
  });
});

describe('assertPathInsideProject', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'nest-confinement-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  it('should accept a path inside the project', () => {
    expect(assertPathInsideProject('dist', 'outDir', { projectRoot })).toBe(
      resolve(projectRoot, 'dist'),
    );
  });

  it('should accept a nested path that does not exist yet', () => {
    expect(
      assertPathInsideProject('dist/nested/deep', 'outDir', { projectRoot }),
    ).toBe(resolve(projectRoot, 'dist/nested/deep'));
  });

  it('should reject a path escaping through ".."', () => {
    expect(() =>
      assertPathInsideProject('../outside', 'outDir', { projectRoot }),
    ).toThrow(/outside of or equal to the project directory/);
  });

  it('should reject an absolute path outside the project', () => {
    expect(() =>
      assertPathInsideProject('/etc', 'outDir', { projectRoot }),
    ).toThrow(/outside of or equal to the project directory/);
  });

  it('should reject the project directory itself', () => {
    expect(() =>
      assertPathInsideProject('.', 'outDir', { projectRoot }),
    ).toThrow(/outside of or equal to the project directory/);
  });

  it('should accept a directory whose name merely starts with ".."', () => {
    // "..cache" is a regular directory inside the project, not a traversal
    expect(assertPathInsideProject('..cache', 'outDir', { projectRoot })).toBe(
      resolve(projectRoot, '..cache'),
    );
  });

  it('should mention the flag that opts out of the check', () => {
    expect(() =>
      assertPathInsideProject('../outside', 'outDir', { projectRoot }),
    ).toThrow(/compilerOptions.allowOutsidePaths/);
  });

  describe('with resolveSymlinks', () => {
    let outsideDir: string;

    beforeEach(() => {
      outsideDir = mkdtempSync(join(tmpdir(), 'nest-confinement-outside-'));
    });

    afterEach(() => {
      rmSync(outsideDir, { recursive: true, force: true });
    });

    it('should reject a symlink pointing outside the project', () => {
      symlinkSync(outsideDir, join(projectRoot, 'dist'), 'dir');

      expect(() =>
        assertPathInsideProject('dist', 'assets[].outDir', {
          projectRoot,
          resolveSymlinks: true,
        }),
      ).toThrow(/outside of or equal to the project directory/);
    });

    it('should reject a path nested under a symlinked directory', () => {
      symlinkSync(outsideDir, join(projectRoot, 'dist'), 'dir');

      expect(() =>
        assertPathInsideProject('dist/nested/file.txt', 'assets[].outDir', {
          projectRoot,
          resolveSymlinks: true,
        }),
      ).toThrow(/outside of or equal to the project directory/);
    });

    it('should accept a symlink that stays inside the project', () => {
      mkdirSync(join(projectRoot, 'build'));
      symlinkSync(join(projectRoot, 'build'), join(projectRoot, 'dist'), 'dir');

      expect(() =>
        assertPathInsideProject('dist/file.txt', 'assets[].outDir', {
          projectRoot,
          resolveSymlinks: true,
        }),
      ).not.toThrow();
    });

    it('should not follow symlinks when the option is off', () => {
      // Deletion unlinks a symlink rather than following it, so a symlinked
      // directory inside the project must stay acceptable there.
      symlinkSync(outsideDir, join(projectRoot, 'node_modules'), 'dir');
      writeFileSync(join(outsideDir, 'tsconfig.tsbuildinfo'), '');

      expect(() =>
        assertPathInsideProject(
          'node_modules/tsconfig.tsbuildinfo',
          'tsBuildInfoFile',
          { projectRoot },
        ),
      ).not.toThrow();
    });
  });
});
