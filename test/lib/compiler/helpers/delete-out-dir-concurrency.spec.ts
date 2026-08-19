import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteOutDirIfEnabled } from '../../../../lib/compiler/helpers/delete-out-dir.js';
import { Configuration } from '../../../../lib/configuration/index.js';

// Unlike "delete-out-dir.spec.ts" these run against the real file system: the
// ENOTEMPTY race they cover lives inside Node's recursive "rm", so a mocked
// one cannot exercise it.
const createConfiguration = (): Required<Configuration> =>
  ({
    monorepo: false,
    sourceRoot: 'src',
    entryFile: 'main',
    exec: '',
    projects: {},
    language: 'ts',
    collection: '@nestjs/schematics',
    compilerOptions: {
      deleteOutDir: true,
      // The fixture lives in the OS temp directory, outside the project
      allowOutsidePaths: true,
    },
    generateOptions: {},
  }) as Required<Configuration>;

const MODULES = 30;
const FILES_PER_MODULE = 12;

describe('deleteOutDirIfEnabled (concurrent writer)', () => {
  let root: string;
  let outDir: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'nest-cli-delete-out-dir-'));
    outDir = join(root, 'dist');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const createOutDir = () => {
    for (let module = 0; module < MODULES; module++) {
      const moduleDir = join(outDir, `module${module}`);
      mkdirSync(moduleDir, { recursive: true });
      for (let file = 0; file < FILES_PER_MODULE; file++) {
        writeFileSync(join(moduleDir, `file${file}.js`), 'module.exports = 1;');
      }
    }
  };

  const writeLateFile = (relativePath: string) => {
    try {
      writeFileSync(join(outDir, relativePath), '{}');
    } catch {
      // The delete already removed the enclosing directory - nothing to race
      // with in that run.
    }
  };

  it('should survive a file written into the output directory during the delete', async () => {
    // The window between "readdir" and "rmdir" is narrow, so the race is
    // sampled rather than forced: without "maxRetries" this fails in roughly
    // half of the attempts.
    for (let attempt = 0; attempt < 10; attempt++) {
      createOutDir();

      const writer = new Promise<void>((resolve) =>
        setTimeout(() => {
          writeLateFile('tsconfig.tsbuildinfo');
          writeLateFile(`module${MODULES - 1}/tsconfig.tsbuildinfo`);
          resolve();
        }, attempt),
      );

      await expect(
        deleteOutDirIfEnabled(createConfiguration(), undefined, outDir),
      ).resolves.toBeUndefined();
      await writer;

      rmSync(outDir, { recursive: true, force: true });
    }
  }, 30_000);

  it('should leave no output directory behind when nothing writes into it', async () => {
    createOutDir();

    await deleteOutDirIfEnabled(createConfiguration(), undefined, outDir);

    expect(existsSync(outDir)).toBe(false);
  });
});
