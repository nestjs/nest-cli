import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  convertToCjs,
  createTempDir,
  fileExists,
  installWebpackDeps,
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

      runNest('build --builder swc --emit-declarations', appPath);

      const distDir = path.join(appPath, 'dist');
      expect(fileExists(path.join(distDir, 'main.js'))).toBe(true);
      // Declaration files should be generated alongside compiled JS
      expect(fileExists(path.join(distDir, 'app.module.d.ts'))).toBe(true);
      expect(fileExists(path.join(distDir, 'app.controller.d.ts'))).toBe(true);
      expect(fileExists(path.join(distDir, 'app.service.d.ts'))).toBe(true);
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
