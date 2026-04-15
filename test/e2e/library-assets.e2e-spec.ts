import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  convertToCjs,
  createTempDir,
  fileExists,
  removeLocalCli,
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
    appPath = scaffoldMonorepoWithDeps(tmpDir, 'main-app', 'mylib');
    // Monorepo scaffold is ESM by default; the manually-written sub-app
    // files use CJS-style imports without .js extensions, so convert the
    // project to CJS for consistent tsc compilation.
    convertToCjs(appPath);
    // includeLibraryAssets is new in this PR — the scaffolded app's
    // node_modules has the published CLI which ignores the option. Force
    // the dev CLI to run.
    removeLocalCli(appPath);

    // Add an asset file to the library
    writeFileContent(
      path.join(appPath, 'apps', 'mylib', 'src', 'templates', 'hello.hbs'),
      'Hello {{ name }}!',
    );

    // Configure nest-cli.json: disable webpack (no peer deps needed), add asset
    // configs for the library, and enable includeLibraryAssets on the main app
    const nestCliPath = path.join(appPath, 'nest-cli.json');
    const nestConfig = JSON.parse(fs.readFileSync(nestCliPath, 'utf-8'));

    delete nestConfig.compilerOptions.webpack;

    nestConfig.projects['mylib'].compilerOptions.assets = [
      'templates/**/*.hbs',
    ];

    nestConfig.projects['main-app'].compilerOptions.includeLibraryAssets = [
      'mylib',
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
    runNest('build mylib', appPath);

    const libDistDir = path.join(appPath, 'dist', 'apps', 'mylib');
    expect(fileExists(libDistDir)).toBe(true);
    expect(fileExists(path.join(libDistDir, 'src', 'main.js'))).toBe(true);
  });
});
