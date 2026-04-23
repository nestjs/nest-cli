import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  convertToCjs,
  createTempDir,
  fileExists,
  installWebpackDeps,
  removeLocalCli,
  removeTempDir,
  runNest,
  scaffoldAppWithDeps,
  scaffoldMonorepoWithDeps,
  spawnNest,
  waitFor,
} from './helpers.js';

describe('Build Command (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-build-');
    appPath = scaffoldAppWithDeps(tmpDir, 'build-app');
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  function cleanDist() {
    fs.rmSync(path.join(appPath, 'dist'), { recursive: true, force: true });
  }

  it('should build the project with default tsc compiler', () => {
    runNest('build', appPath);

    const distDir = path.join(appPath, 'dist');
    expect(fileExists(distDir)).toBe(true);
    expect(fileExists(path.join(distDir, 'src', 'main.js'))).toBe(true);
    expect(fileExists(path.join(distDir, 'src', 'app.module.js'))).toBe(true);
    expect(fileExists(path.join(distDir, 'src', 'app.controller.js'))).toBe(
      true,
    );
    expect(fileExists(path.join(distDir, 'src', 'app.service.js'))).toBe(true);
  });

  it('should build with a custom tsconfig path using --path', () => {
    cleanDist();

    // Use the existing tsconfig.build.json
    runNest('build --path tsconfig.build.json', appPath);

    expect(fileExists(path.join(appPath, 'dist', 'src', 'main.js'))).toBe(true);
  });

  it('should build in --watch mode and detect initial compilation', async () => {
    cleanDist();

    const proc = spawnNest('build --watch', appPath);

    try {
      // Wait for the initial compilation to complete
      await waitFor(
        () =>
          proc.output().includes('Found 0 errors') ||
          proc.output().includes('Watching for file changes'),
        60_000,
      );

      // dist should be produced
      expect(fileExists(path.join(appPath, 'dist', 'src', 'main.js'))).toBe(
        true,
      );
    } finally {
      proc.kill();
    }
  });

  describe('with SWC builder', () => {
    beforeAll(() => {
      // Install SWC dependencies
      execSync('npm install --save-dev @swc/cli @swc/core', {
        cwd: appPath,
        encoding: 'utf-8',
        timeout: 120_000,
        stdio: 'pipe',
      });
    });

    it('should build using --builder swc', () => {
      cleanDist();

      runNest('build --builder swc', appPath);

      const distDir = path.join(appPath, 'dist');
      expect(fileExists(distDir)).toBe(true);
      expect(fileExists(path.join(distDir, 'main.js'))).toBe(true);
      expect(fileExists(path.join(distDir, 'app.module.js'))).toBe(true);
    });

    it('should build with --type-check and --builder swc', () => {
      cleanDist();

      runNest('build --builder swc --type-check', appPath);

      expect(fileExists(path.join(appPath, 'dist', 'main.js'))).toBe(true);
    });

    it('should emit .d.ts declaration files with --emit-declarations', () => {
      cleanDist();

      // The --emit-declarations flag is new in this PR, so the published
      // @nestjs/cli in the scaffolded project's node_modules doesn't know
      // about it. Force the dev CLI to run instead of delegating.
      removeLocalCli(appPath);

      // The SWC compiler delegates declaration emission to `tsc
      // --emitDeclarationOnly`, which requires `declaration: true` in the
      // tsconfig. Enable it on both tsconfig.json and tsconfig.build.json
      // to cover either tsconfig that nest may resolve.
      const tsconfigJsonPath = path.join(appPath, 'tsconfig.json');
      const tsconfigBuildPath = path.join(appPath, 'tsconfig.build.json');
      const originalTsconfigJson = fs.readFileSync(tsconfigJsonPath, 'utf-8');
      const originalTsconfigBuild = fs.readFileSync(tsconfigBuildPath, 'utf-8');
      const tsconfigJson = JSON.parse(originalTsconfigJson);
      tsconfigJson.compilerOptions = {
        ...tsconfigJson.compilerOptions,
        declaration: true,
      };
      fs.writeFileSync(tsconfigJsonPath, JSON.stringify(tsconfigJson, null, 2));

      try {
        const output = runNest(
          'build --builder swc --emit-declarations',
          appPath,
        );

        const distDir = path.join(appPath, 'dist');
        expect(fileExists(path.join(distDir, 'main.js'))).toBe(true);

        // Walk dist/ recursively to find any .d.ts files — be tolerant of
        // exact output paths since tsc's layout depends on rootDir inference.
        const findDts = (dir: string): string[] => {
          if (!fileExists(dir)) return [];
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          return entries.flatMap((e) => {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) return findDts(full);
            return e.name.endsWith('.d.ts') ? [full] : [];
          });
        };
        const dtsFiles = findDts(distDir);

        // Helpful diagnostic if assertion below fails
        if (dtsFiles.length === 0) {
          console.error(
            '[emit-declarations test] no .d.ts files found under',
            distDir,
          );
          console.error(
            '[emit-declarations test] dist contents:',
            fileExists(distDir)
              ? fs.readdirSync(distDir, { recursive: true })
              : '(missing)',
          );
          console.error('[emit-declarations test] nest build output:', output);
        }
        expect(dtsFiles.length).toBeGreaterThan(0);
      } finally {
        // Restore the original tsconfigs so subsequent tests aren't affected
        fs.writeFileSync(tsconfigJsonPath, originalTsconfigJson);
        fs.writeFileSync(tsconfigBuildPath, originalTsconfigBuild);
      }
    });

    it('should not emit .d.ts declaration files without --emit-declarations', () => {
      cleanDist();

      runNest('build --builder swc', appPath);

      const distDir = path.join(appPath, 'dist');
      expect(fileExists(path.join(distDir, 'main.js'))).toBe(true);
      // Without the flag, declaration files should NOT be present
      expect(fileExists(path.join(distDir, 'app.module.d.ts'))).toBe(false);
    });
  });
});

describe('Build Command - Monorepo with webpack (e2e)', () => {
  let tmpDir: string;
  let monoPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-build-mono-');
    monoPath = scaffoldMonorepoWithDeps(tmpDir, 'main-app', 'secondary');
    convertToCjs(monoPath);
    installWebpackDeps(monoPath);
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  function cleanDist() {
    fs.rmSync(path.join(monoPath, 'dist'), { recursive: true, force: true });
  }

  it('should build the default app with webpack', () => {
    cleanDist();

    const output = runNest('build', monoPath);

    expect(output).toContain('webpack');
    expect(output).toContain('compiled successfully');
    expect(
      fileExists(path.join(monoPath, 'dist', 'apps', 'main-app', 'main.js')),
    ).toBe(true);
  });

  it('should build a specific sub-app by name with webpack', () => {
    cleanDist();

    const output = runNest('build secondary', monoPath);

    expect(output).toContain('webpack');
    expect(output).toContain('compiled successfully');
    expect(
      fileExists(path.join(monoPath, 'dist', 'apps', 'secondary', 'main.js')),
    ).toBe(true);
  });

  it('should build in --watch mode with webpack and detect initial compilation', async () => {
    cleanDist();

    const proc = spawnNest('build --watch', monoPath);

    try {
      await waitFor(
        () => proc.output().includes('compiled successfully'),
        60_000,
      );

      expect(
        fileExists(path.join(monoPath, 'dist', 'apps', 'main-app', 'main.js')),
      ).toBe(true);
    } finally {
      proc.kill();
    }
  });
});
