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

  it('should handle --dry-run flag without crashing', () => {
    // Note: --dry-run in `nest add` applies to schematics only,
    // the package itself may still be installed.
    const { stderr, exitCode } = runNestRaw(
      'add @nestjs/swagger --dry-run',
      appPath,
    );

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('does not support schematics');
  });

  it('should add with --skip-install flag', () => {
    const { stderr, exitCode } = runNestRaw(
      'add @nestjs/mapped-types --skip-install',
      appPath,
    );

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('does not support schematics');
  });
});
