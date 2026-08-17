import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTempDir,
  fileExists,
  readFileContent,
  removeTempDir,
  runNest,
  scaffoldApp,
} from './helpers.js';

describe('New Command (e2e)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempDir('nest-e2e-new-');
  });

  afterEach(() => {
    removeTempDir(tmpDir);
  });

  it('should generate a new TypeScript project', () => {
    const appPath = scaffoldApp(tmpDir, 'my-app');

    // Core project files
    expect(fileExists(path.join(appPath, 'package.json'))).toBe(true);
    expect(fileExists(path.join(appPath, 'tsconfig.json'))).toBe(true);
    expect(fileExists(path.join(appPath, 'tsconfig.build.json'))).toBe(true);
    expect(fileExists(path.join(appPath, 'nest-cli.json'))).toBe(true);

    // Source files
    expect(fileExists(path.join(appPath, 'src', 'main.ts'))).toBe(true);
    expect(fileExists(path.join(appPath, 'src', 'app.module.ts'))).toBe(true);
    expect(fileExists(path.join(appPath, 'src', 'app.controller.ts'))).toBe(
      true,
    );
    expect(fileExists(path.join(appPath, 'src', 'app.service.ts'))).toBe(true);
    expect(
      fileExists(path.join(appPath, 'src', 'app.controller.spec.ts')),
    ).toBe(true);

    // Test files
    expect(fileExists(path.join(appPath, 'test', 'app.e2e-spec.ts'))).toBe(
      true,
    );
    expect(fileExists(path.join(appPath, 'vitest.config.e2e.ts'))).toBe(true);

    // package.json content
    const pkg = JSON.parse(readFileContent(path.join(appPath, 'package.json')));
    expect(pkg.name).toBe('my-app');
    expect(pkg.dependencies['@nestjs/core']).toBeDefined();
    expect(pkg.dependencies['@nestjs/common']).toBeDefined();
  });

  it('should respect --directory flag', () => {
    runNest(
      'new my-app --skip-install --skip-git -p npm --directory custom-dir',
      tmpDir,
    );
    const appPath = path.join(tmpDir, 'custom-dir');

    expect(fileExists(path.join(appPath, 'package.json'))).toBe(true);
    expect(fileExists(path.join(appPath, 'src', 'main.ts'))).toBe(true);

    const pkg = JSON.parse(readFileContent(path.join(appPath, 'package.json')));
    expect(pkg.name).toBe('my-app');
  });

  it('should generate a JavaScript project with --language js', () => {
    const appPath = scaffoldApp(tmpDir, 'js-app', '--language js');

    expect(fileExists(path.join(appPath, 'package.json'))).toBe(true);
    expect(fileExists(path.join(appPath, 'jsconfig.json'))).toBe(true);

    // JS project should have .js source files
    expect(fileExists(path.join(appPath, 'src', 'main.js'))).toBe(true);
    expect(fileExists(path.join(appPath, 'src', 'app.module.js'))).toBe(true);
    expect(fileExists(path.join(appPath, 'src', 'app.controller.js'))).toBe(
      true,
    );
    expect(fileExists(path.join(appPath, 'src', 'app.service.js'))).toBe(true);
  });

  it('should enable strict mode with --strict', () => {
    const appPath = scaffoldApp(tmpDir, 'strict-app', '--strict');

    const tsconfig = JSON.parse(
      readFileContent(path.join(appPath, 'tsconfig.json')),
    );
    expect(tsconfig.compilerOptions.strict).toBeTruthy();
  });

  it('should produce dry-run output without creating files', () => {
    const output = runNest(
      'new dry-app --skip-install --skip-git -p npm --dry-run',
      tmpDir,
    );
    const appPath = path.join(tmpDir, 'dry-app');

    // Dry run should NOT create the directory
    expect(fileExists(appPath)).toBe(false);
    // But should produce output describing what would be created
    expect(output).toContain('CREATE');
  });

  it('should skip git initialization with --skip-git', () => {
    const appPath = scaffoldApp(tmpDir, 'no-git-app');

    // --skip-git is already in scaffoldApp
    expect(fileExists(path.join(appPath, '.git'))).toBe(false);
  });

  it('should generate correct nest-cli.json', () => {
    const appPath = scaffoldApp(tmpDir, 'cfg-app');
    const config = JSON.parse(
      readFileContent(path.join(appPath, 'nest-cli.json')),
    );

    expect(config.collection).toBe('@nestjs/schematics');
    expect(config.sourceRoot).toBe('src');
  });

  it('should set package manager in package.json scripts', () => {
    const appPath = scaffoldApp(tmpDir, 'pm-app');
    const pkg = JSON.parse(readFileContent(path.join(appPath, 'package.json')));

    // Should have standard scripts
    expect(pkg.scripts['build']).toBeDefined();
    expect(pkg.scripts['start']).toBeDefined();
    expect(pkg.scripts['test']).toBeDefined();
  });
});
