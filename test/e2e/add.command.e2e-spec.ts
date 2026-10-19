import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import {
  createTempDir,
  readFileContent,
  removeTempDir,
  runNest,
  runNestRaw,
  scaffoldAppWithDeps,
} from './helpers.js';

describe('Add Command (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-add-');
    appPath = scaffoldAppWithDeps(tmpDir, 'add-app');
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  // Modern @nestjs/* packages (config, swagger, ...) no longer ship a
  // `nest-add` schematic, so `nest add` installs the package and then exits
  // with a clear "does not support schematics" error. These tests pin that
  // contract: the package lands in package.json and the failure is a clean,
  // informative message rather than a crash.

  it('should install the package and report when it lacks schematics', () => {
    const { stderr, exitCode } = runNestRaw('add @nestjs/config', appPath);

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('does not support schematics');

    const pkg = JSON.parse(readFileContent(path.join(appPath, 'package.json')));
    expect(pkg.dependencies['@nestjs/config']).toBeDefined();
  });

  it('should not install the library on a dry run', () => {
    const pkgPath = path.join(appPath, 'package.json');
    const pkgBefore = readFileContent(pkgPath);

    const { stdout, exitCode } = runNestRaw(
      'add @nestjs/swagger --dry-run',
      appPath,
    );

    // The nest-add schematic ships with the library, so a dry run of a library
    // that is not installed yet cannot be previewed; it must exit cleanly
    // without touching package.json.
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Dry run: skipping installation');
    expect(stdout).toContain('is not installed');
    expect(readFileContent(pkgPath)).toBe(pkgBefore);
  });

  it('should add with --skip-install flag', () => {
    const pkgPath = path.join(appPath, 'package.json');
    const pkgBefore = readFileContent(pkgPath);

    // @nestjs/common is already installed by the scaffold, so the schematic
    // lookup runs against it without depending on earlier tests.
    const { stderr, exitCode } = runNestRaw(
      'add @nestjs/common --skip-install',
      appPath,
    );

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('does not support schematics');
    expect(readFileContent(pkgPath)).toBe(pkgBefore);
  });
});
