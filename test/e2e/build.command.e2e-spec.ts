import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  convertToCjs,
  createTempDir,
  fileExists,
  installWebpackDeps,
  npmInstall,
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
    expect(fileExists(path.join(distDir, 'main.js'))).toBe(true);
    expect(fileExists(path.join(distDir, 'app.module.js'))).toBe(true);
    expect(fileExists(path.join(distDir, 'app.controller.js'))).toBe(true);
    expect(fileExists(path.join(distDir, 'app.service.js'))).toBe(true);
  });

  it('should build with a custom tsconfig path using --path', () => {
    cleanDist();

    // Use the existing tsconfig.build.json
    runNest('build --path tsconfig.build.json', appPath);

    expect(fileExists(path.join(appPath, 'dist', 'main.js'))).toBe(true);
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
      expect(fileExists(path.join(appPath, 'dist', 'main.js'))).toBe(true);
    } finally {
      proc.kill();
    }
  });

  describe('with SWC builder', () => {
    beforeAll(() => {
      // Install SWC dependencies
      npmInstall(appPath, '--save-dev @swc/cli @swc/core');
      // The install restores the published @nestjs/cli into node_modules,
      // which would shadow the CLI under test — remove it again.
      removeLocalCli(appPath);
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

    it('should emit loadable ES modules for a "type": "module" project', () => {
      cleanDist();

      runNest('build --builder swc', appPath);

      const distDir = path.join(appPath, 'dist');
      const mainJs = fs.readFileSync(path.join(distDir, 'main.js'), 'utf-8');
      expect(mainJs).not.toMatch(/\bexports\b|\brequire\(/);
      expect(mainJs).toMatch(/^import .* from ['"]\.\/app\.module\.js['"];$/m);

      // Load the module graph without bootstrapping the HTTP server.
      const output = execSync(
        `node --input-type=module -e "const { AppModule } = await import('./dist/app.module.js'); console.log(typeof AppModule);"`,
        { cwd: appPath, encoding: 'utf-8' },
      );
      expect(output.trim()).toBe('function');
    });

    it('should let .swcrc override the default module type', () => {
      cleanDist();

      const swcrcPath = path.join(appPath, '.swcrc');
      fs.writeFileSync(
        swcrcPath,
        JSON.stringify({ module: { type: 'commonjs' } }),
      );
      try {
        runNest('build --builder swc', appPath);

        const mainJs = fs.readFileSync(
          path.join(appPath, 'dist', 'main.js'),
          'utf-8',
        );
        expect(mainJs).toContain('require("./app.module.js")');
      } finally {
        fs.rmSync(swcrcPath, { force: true });
      }
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

    it('should resolve tsconfig "paths" without "baseUrl"', () => {
      cleanDist();
      removeLocalCli(appPath);

      // TypeScript 6 deprecates "baseUrl", and tsc then resolves "paths"
      // relative to the tsconfig directory. swc used to panic here because
      // it was handed "paths" without a "jsc.baseUrl".
      const tsconfigJsonPath = path.join(appPath, 'tsconfig.json');
      const originalTsconfigJson = fs.readFileSync(tsconfigJsonPath, 'utf-8');
      const tsconfigJson = JSON.parse(originalTsconfigJson);
      delete tsconfigJson.compilerOptions.baseUrl;
      tsconfigJson.compilerOptions.paths = { '@shared/*': ['./src/shared/*'] };
      fs.writeFileSync(tsconfigJsonPath, JSON.stringify(tsconfigJson, null, 2));

      const sharedDir = path.join(appPath, 'src', 'shared');
      const consumerPath = path.join(appPath, 'src', 'alias-consumer.ts');
      fs.mkdirSync(sharedDir, { recursive: true });
      fs.writeFileSync(
        path.join(sharedDir, 'index.ts'),
        'export const shared = 42;\n',
      );
      fs.writeFileSync(
        consumerPath,
        "import { shared } from '@shared/index.js';\nexport const value = shared;\n",
      );

      try {
        runNest('build --builder swc', appPath);

        const consumerJs = path.join(appPath, 'dist', 'alias-consumer.js');
        expect(fileExists(consumerJs)).toBe(true);
        expect(fs.readFileSync(consumerJs, 'utf-8')).toContain(
          './shared/index.js',
        );
      } finally {
        fs.writeFileSync(tsconfigJsonPath, originalTsconfigJson);
        fs.rmSync(sharedDir, { recursive: true, force: true });
        fs.rmSync(consumerPath, { force: true });
      }
    });
  });

  describe('with a tsconfig outside the working directory', () => {
    // TypeScript 6 deprecates "baseUrl", and tsc then resolves "paths"
    // relative to the directory of the tsconfig that declares them. The tsc
    // hook used to resolve them against the process working directory, so the
    // alias matched nothing and was emitted verbatim.
    const configDir = () => path.join(appPath, 'config');
    const sharedDir = () => path.join(appPath, 'src', 'shared');
    const consumerPath = () => path.join(appPath, 'src', 'alias-consumer.ts');

    beforeAll(() => {
      // The scaffolded app ships its own @nestjs/cli in node_modules, and the
      // CLI hands off to that local copy when present — which would test the
      // published build instead of this working tree.
      removeLocalCli(appPath);
    });

    afterAll(() => {
      fs.rmSync(configDir(), { recursive: true, force: true });
      fs.rmSync(sharedDir(), { recursive: true, force: true });
      fs.rmSync(consumerPath(), { force: true });
    });

    it('should resolve tsconfig "paths" declared without "baseUrl"', () => {
      cleanDist();

      fs.mkdirSync(configDir(), { recursive: true });
      fs.writeFileSync(
        path.join(configDir(), 'tsconfig.build.json'),
        JSON.stringify(
          {
            extends: '../tsconfig.json',
            compilerOptions: {
              rootDir: '../src',
              outDir: '../dist',
              paths: { '@shared/*': ['../src/shared/*'] },
            },
            include: ['../src'],
          },
          null,
          2,
        ),
      );

      fs.mkdirSync(sharedDir(), { recursive: true });
      fs.writeFileSync(
        path.join(sharedDir(), 'index.ts'),
        'export const shared = 42;\n',
      );
      fs.writeFileSync(
        consumerPath(),
        "import { shared } from '@shared/index.js';\nexport const value = shared;\n",
      );

      runNest('build --path config/tsconfig.build.json', appPath);

      const consumerJs = path.join(appPath, 'dist', 'alias-consumer.js');
      expect(fileExists(consumerJs)).toBe(true);
      const emitted = fs.readFileSync(consumerJs, 'utf-8');
      expect(emitted).toContain('./shared/index.js');
      expect(emitted).not.toContain('@shared/');
    });
  });

  describe('dotfiles in a directory asset (#3522)', () => {
    // A bare directory entry ("assets": ["config"]) is expanded by a second
    // glob call inside the assets manager. That call used to drop dot-prefixed
    // entries, so `nest build` copied strictly fewer files than the same
    // config under `--watchAssets`, which uses chokidar and has no dot filter.
    const nestCliPath = () => path.join(appPath, 'nest-cli.json');
    const envsDir = () => path.join(appPath, 'src', 'config', 'envs');
    let originalNestCli: string;

    beforeAll(() => {
      // The scaffolded app ships its own @nestjs/cli in node_modules, and the
      // CLI hands off to that local copy when present — which would test the
      // published build instead of this working tree.
      removeLocalCli(appPath);

      originalNestCli = fs.readFileSync(nestCliPath(), 'utf-8');
      fs.mkdirSync(envsDir(), { recursive: true });
      fs.writeFileSync(path.join(envsDir(), '.development'), 'SECRET=1');
      fs.writeFileSync(path.join(envsDir(), 'prod.env'), 'X=1');
    });

    afterAll(() => {
      fs.writeFileSync(nestCliPath(), originalNestCli);
      fs.rmSync(path.join(appPath, 'src', 'config'), {
        recursive: true,
        force: true,
      });
    });

    function setAssets(assets: string[]) {
      const config = JSON.parse(fs.readFileSync(nestCliPath(), 'utf-8'));
      config.compilerOptions = { ...config.compilerOptions, assets };
      fs.writeFileSync(nestCliPath(), JSON.stringify(config, null, 2));
    }

    /**
     * Where the copied `envs` directory ends up depends on the effective
     * rootDir (see #3387), so locate it rather than hard-coding a layout: the
     * claim under test is that both files land in the *same* place.
     */
    function findCopiedEnvsDir(): string | undefined {
      const distDir = path.join(appPath, 'dist');
      const entries = fs.readdirSync(distDir, {
        recursive: true,
        encoding: 'utf-8',
      });
      const match = entries.find(
        (entry) => path.basename(entry) === 'prod.env',
      );
      return match ? path.dirname(path.join(distDir, match)) : undefined;
    }

    it('should copy a dotfile nested under a bare directory asset', () => {
      cleanDist();
      setAssets(['config']);

      runNest('build', appPath);

      const copiedEnvs = findCopiedEnvsDir();
      expect(copiedEnvs).toBeDefined();
      expect(fileExists(path.join(copiedEnvs!, '.development'))).toBe(true);
    });

    it('should keep copying dotfiles for the wildcard asset form', () => {
      cleanDist();
      setAssets(['config/envs/*']);

      runNest('build', appPath);

      const copiedEnvs = findCopiedEnvsDir();
      expect(copiedEnvs).toBeDefined();
      expect(fileExists(path.join(copiedEnvs!, '.development'))).toBe(true);
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

describe('Build Command - Monorepo with SWC (e2e)', () => {
  let tmpDir: string;
  let monoPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-build-mono-swc-');
    monoPath = scaffoldMonorepoWithDeps(tmpDir, 'main-app', 'secondary');

    // The shared monorepo fixture turns webpack on, which takes precedence
    // over "--builder swc".
    const cliJsonPath = path.join(monoPath, 'nest-cli.json');
    const cliJson = JSON.parse(fs.readFileSync(cliJsonPath, 'utf-8'));
    delete cliJson.compilerOptions.webpack;
    fs.writeFileSync(cliJsonPath, JSON.stringify(cliJson, null, 2));

    npmInstall(monoPath, '--save-dev @swc/cli @swc/core');
    removeLocalCli(monoPath);
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  it('should compile the named app, not the default one', () => {
    const outDir = path.join(monoPath, 'dist', 'apps', 'secondary');
    fs.rmSync(path.join(monoPath, 'dist'), { recursive: true, force: true });

    runNest('build secondary --builder swc', monoPath);

    const emitted = fs
      .readdirSync(outDir, { recursive: true })
      .filter((f): f is string => typeof f === 'string' && f.endsWith('.js'))
      .map((f) => path.basename(f));

    expect(emitted).toContain('secondary.module.js');
    expect(emitted).not.toContain('app.module.js');
    // The default app's spec files are outside this app's tsconfig
    // "exclude", so they would be emitted too.
    expect(emitted).not.toContain('app.controller.spec.js');

    // "nest start" resolves "<outDir>/<sourceRoot>/<entryFile>" first.
    expect(
      fileExists(path.join(outDir, 'apps', 'secondary', 'src', 'main.js')),
    ).toBe(true);
  });

  it('should emit the default app where "nest start" looks for it', () => {
    const outDir = path.join(monoPath, 'dist', 'apps', 'main-app');
    fs.rmSync(path.join(monoPath, 'dist'), { recursive: true, force: true });

    runNest('build --builder swc', monoPath);

    expect(
      fileExists(path.join(outDir, 'apps', 'main-app', 'src', 'main.js')),
    ).toBe(true);
  });
});
