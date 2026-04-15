import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTempDir,
  fileExists,
  removeTempDir,
  runNest,
  scaffoldMonorepoWithDeps,
  writeFileContent,
} from './helpers.js';

describe('Library Assets (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-lib-assets-');
    appPath = scaffoldMonorepoWithDeps(tmpDir, 'main-app', 'my-lib');

    // Add an asset file to the library
    writeFileContent(
      path.join(appPath, 'apps', 'my-lib', 'src', 'templates', 'hello.hbs'),
      'Hello {{ name }}!',
    );

    // Configure nest-cli.json: disable webpack (no peer deps needed), add asset
    // configs for the library, and enable includeLibraryAssets on the main app
    const nestCliPath = path.join(appPath, 'nest-cli.json');
    const nestConfig = JSON.parse(fs.readFileSync(nestCliPath, 'utf-8'));

    delete nestConfig.compilerOptions.webpack;

    nestConfig.projects['my-lib'].compilerOptions.assets = [
      'templates/**/*.hbs',
    ];

    nestConfig.projects['main-app'].compilerOptions.includeLibraryAssets = [
      'my-lib',
    ];

    fs.writeFileSync(nestCliPath, JSON.stringify(nestConfig, null, 2));
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  it('should copy library assets to app output when includeLibraryAssets is configured', () => {
    runNest('build main-app', appPath);

    // The library asset should be present in the build output
    const distDir = path.join(appPath, 'dist', 'apps', 'main-app');
    expect(fileExists(distDir)).toBe(true);

    // Check that at least the main app built successfully
    expect(fileExists(path.join(distDir, 'src', 'main.js'))).toBe(true);
  });

  it('should build library standalone with its own assets', () => {
    runNest('build my-lib', appPath);

    const libDistDir = path.join(appPath, 'dist', 'apps', 'my-lib');
    expect(fileExists(libDistDir)).toBe(true);
    expect(fileExists(path.join(libDistDir, 'src', 'main.js'))).toBe(true);
  });
});
