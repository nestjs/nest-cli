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

  it('should add @nestjs/config library to the project', () => {
    runNest('add @nestjs/config', appPath);

    const pkg = JSON.parse(readFileContent(path.join(appPath, 'package.json')));
    expect(pkg.dependencies['@nestjs/config']).toBeDefined();
  });

  it('should handle --dry-run flag without crashing', () => {
    // Note: --dry-run in `nest add` applies to schematics only,
    // the package itself may still be installed.
    const { exitCode } = runNestRaw('add @nestjs/swagger --dry-run', appPath);

    expect(exitCode).toBe(0);
  });

  it('should add with --skip-install flag', () => {
    const { stdout, exitCode } = runNestRaw(
      'add @nestjs/mapped-types --skip-install',
      appPath,
    );

    // With skip-install, the schematics may still run but no npm install
    // The exit should not crash
    expect(exitCode).toBe(0);
  });
});
