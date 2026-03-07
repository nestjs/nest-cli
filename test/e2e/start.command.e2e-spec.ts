import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';
import {
  createTempDir,
  enableRspack,
  enableWebpack,
  freePort,
  httpGet,
  readFileContent,
  removeLocalCli,
  removeTempDir,
  runNest,
  runNestRaw,
  scaffoldAppWithDeps,
  scaffoldEsmAppWithDeps,
  scaffoldMonorepoWithDeps,
  spawnNest,
  waitFor,
  writeFileContent,
} from './helpers.js';

describe('Start Command - CJS project (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-start-');
    appPath = scaffoldAppWithDeps(tmpDir, 'start-app');
    // Pre-build so that start is faster
    runNest('build', appPath);
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  // Allow port to be released between tests
  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 500));
  });

  it('should start the application and respond to HTTP requests', async () => {
    const port = 4001;
    const proc = spawnNest('start', appPath, { PORT: String(port) });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
      expect(response.body).toContain('Hello World!');
    } finally {
      proc.kill();
    }
  });

  it('should start with --debug flag', async () => {
    const port = 4002;
    const proc = spawnNest('start --debug', appPath, { PORT: String(port) });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toMatch(/Debugger listening on/);

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
    } finally {
      proc.kill();
    }
  });

  it('should start with --exec flag', async () => {
    const port = 4003;
    const proc = spawnNest('start --exec node', appPath, {
      PORT: String(port),
    });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
    } finally {
      proc.kill();
    }
  });

  it('should start in --watch mode and rebuild on file change', async () => {
    const port = 4004;
    freePort(port);

    // Ensure the source file has the original content before starting
    const servicePath = path.join(appPath, 'src', 'app.service.ts');
    const original = readFileContent(servicePath);
    if (!original.includes("'Hello World!'")) {
      writeFileContent(
        servicePath,
        original.replace("'Hello Watch!'", "'Hello World!'"),
      );
      // Give the filesystem some time to settle
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Clean dist so tsc --watch recompiles from source
    execSync('rm -rf dist', { cwd: appPath, stdio: 'ignore' });

    const proc = spawnNest('start --watch', appPath, {
      PORT: String(port),
    });

    try {
      // Wait for the initial compilation + start
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      // Verify initial response (retry until server is fully ready)
      await waitFor(
        async () => {
          try {
            const res = await httpGet(`http://127.0.0.1:${port}`, 2000);
            return res.status === 200 && res.body.includes('Hello World!');
          } catch {
            return false;
          }
        },
        30_000,
        1000,
      );

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
      expect(response.body).toContain('Hello World!');

      // Now modify a source file to trigger a rebuild
      const modified = readFileContent(servicePath).replace(
        "'Hello World!'",
        "'Hello Watch!'",
      );
      writeFileContent(servicePath, modified);

      // Wait for the server to restart and serve the new content
      await waitFor(
        async () => {
          try {
            const res = await httpGet(`http://127.0.0.1:${port}`, 2000);
            return res.body.includes('Hello Watch!');
          } catch {
            return false;
          }
        },
        60_000,
        1000,
      );

      const response2 = await httpGet(`http://127.0.0.1:${port}`);
      expect(response2.status).toBe(200);
      expect(response2.body).toContain('Hello Watch!');
    } finally {
      proc.kill();
      // Restore the original source file for subsequent tests
      writeFileContent(servicePath, original);
    }
  });

  describe('with SWC builder', () => {
    beforeAll(() => {
      execSync('npm install --save-dev @swc/cli @swc/core', {
        cwd: appPath,
        encoding: 'utf-8',
        timeout: 120_000,
        stdio: 'pipe',
      });
    });

    it('should start with --builder swc', async () => {
      const port = 4005;
      const proc = spawnNest('start --builder swc', appPath, {
        PORT: String(port),
      });

      try {
        await waitFor(
          () => proc.output().includes('Nest application successfully started'),
          60_000,
        );

        const response = await httpGet(`http://127.0.0.1:${port}`);
        expect(response.status).toBe(200);
        expect(response.body).toContain('Hello');
      } finally {
        proc.kill();
      }
    });
  });
});

describe('Start Command - Monorepo with webpack (e2e)', () => {
  let tmpDir: string;
  let monoPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-start-mono-');
    monoPath = scaffoldMonorepoWithDeps(tmpDir, 'primary', 'worker');
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 500));
  });

  it('should start the default app with webpack in monorepo mode', async () => {
    const port = 4006;
    const proc = spawnNest('start', monoPath, { PORT: String(port) });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toContain('webpack');
      expect(proc.output()).toContain('compiled successfully');

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
    } finally {
      proc.kill();
    }
  });

  it('should start a specific sub-app by name in monorepo mode', async () => {
    const port = 4007;
    // Patch the worker entryFile to use PORT env or specific port
    const workerMain = path.join(monoPath, 'apps', 'worker', 'src', 'main.ts');
    const mainContent = readFileContent(workerMain);
    if (!mainContent.includes('process.env.PORT')) {
      writeFileContent(
        workerMain,
        mainContent.replace('3000', 'process.env.PORT ?? 3000'),
      );
    }

    const proc = spawnNest('start worker', monoPath, {
      PORT: String(port),
    });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toContain('webpack');

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
    } finally {
      proc.kill();
    }
  });

  it('should start in --watch mode with webpack in monorepo mode', async () => {
    const port = 4008;
    const proc = spawnNest('start --watch', monoPath, {
      PORT: String(port),
    });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toContain('webpack');

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
    } finally {
      proc.kill();
    }
  });
});

describe('Start Command - ESM project (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-start-esm-');
    appPath = scaffoldEsmAppWithDeps(tmpDir, 'esm-app');
    // Pre-build so that start is faster
    runNest('build', appPath);
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 500));
  });

  it('should start an ESM project with top-level await', async () => {
    const port = 4010;
    const proc = spawnNest('start', appPath, { PORT: String(port) });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
      expect(response.body).toContain('Hello World!');
    } finally {
      proc.kill();
    }
  });

  it('should start an ESM project with --watch mode and rebuild on file change', async () => {
    const port = 4011;
    freePort(port);

    const servicePath = path.join(appPath, 'src', 'app.service.ts');
    const original = readFileContent(servicePath);

    // Clean dist so tsc --watch recompiles from source
    execSync('rm -rf dist', { cwd: appPath, stdio: 'ignore' });

    const proc = spawnNest('start --watch', appPath, {
      PORT: String(port),
    });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      await waitFor(
        async () => {
          try {
            const res = await httpGet(`http://127.0.0.1:${port}`, 2000);
            return res.status === 200 && res.body.includes('Hello World!');
          } catch {
            return false;
          }
        },
        30_000,
        1000,
      );

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
      expect(response.body).toContain('Hello World!');

      // Modify a source file to trigger a rebuild
      const modified = original.replace("'Hello World!'", "'Hello ESM!'");
      writeFileContent(servicePath, modified);

      await waitFor(
        async () => {
          try {
            const res = await httpGet(`http://127.0.0.1:${port}`, 2000);
            return res.body.includes('Hello ESM!');
          } catch {
            return false;
          }
        },
        60_000,
        1000,
      );

      const response2 = await httpGet(`http://127.0.0.1:${port}`);
      expect(response2.status).toBe(200);
      expect(response2.body).toContain('Hello ESM!');
    } finally {
      proc.kill();
      writeFileContent(servicePath, original);
    }
  });

  it('should start an ESM project with --debug flag', async () => {
    const port = 4012;
    const proc = spawnNest('start --debug', appPath, { PORT: String(port) });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toMatch(/Debugger listening on/);

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
    } finally {
      proc.kill();
    }
  });

  describe('with SWC builder', () => {
    beforeAll(() => {
      execSync('npm install --save-dev @swc/cli @swc/core', {
        cwd: appPath,
        encoding: 'utf-8',
        timeout: 120_000,
        stdio: 'pipe',
      });
    });

    it.skip('should start an ESM project with --builder swc', async () => {
      const port = 4013;
      const proc = spawnNest('start --builder swc', appPath, {
        PORT: String(port),
      });

      try {
        await waitFor(
          () =>
            proc.output().includes('Nest application successfully started'),
          60_000,
        );

        const response = await httpGet(`http://127.0.0.1:${port}`);
        expect(response.status).toBe(200);
        expect(response.body).toContain('Hello');
      } finally {
        proc.kill();
      }
    });
  });
});

describe('Start Command - ESM project with rspack (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-start-esm-rs-');
    appPath = scaffoldEsmAppWithDeps(tmpDir, 'esm-rs-app');
    enableRspack(appPath);
    // Remove the locally-installed @nestjs/cli so the development CLI is used
    removeLocalCli(appPath);
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 500));
  });

  it('should build an ESM project with rspack and produce clean ESM output', () => {
    const { stdout, stderr, exitCode } = runNestRaw('build', appPath);
    const output = stdout + stderr;

    expect(exitCode).toBe(0);
    expect(output).toMatch(/rspack/i);
    expect(output).toContain('compiled successfully');

    const distMain = path.join(appPath, 'dist', 'main.js');
    const bundleContent = readFileContent(distMain);

    // The output must not contain require() calls — only import statements
    const codeLines = bundleContent
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('//'))
      .filter((line) => !line.trimStart().startsWith('*'))
      .join('\n');

    expect(codeLines).not.toMatch(/\brequire\s*\(/);
  });

  it('should start an ESM project with rspack and respond to HTTP', async () => {
    const port = 4020;
    const proc = spawnNest('start', appPath, { PORT: String(port) });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toMatch(/rspack/i);
      expect(proc.output()).toContain('compiled successfully');

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
      expect(response.body).toContain('Hello World!');
    } finally {
      proc.kill();
    }
  });

  it('should start an ESM project with rspack in --watch mode', async () => {
    const port = 4021;
    freePort(port);

    const proc = spawnNest('start --watch', appPath, {
      PORT: String(port),
    });

    try {
      await waitFor(
        () => proc.output().includes('Nest application successfully started'),
        60_000,
      );

      expect(proc.output()).toMatch(/rspack/i);

      const response = await httpGet(`http://127.0.0.1:${port}`);
      expect(response.status).toBe(200);
      expect(response.body).toContain('Hello World!');
    } finally {
      proc.kill();
    }
  });
});

describe('Start Command - ESM project with webpack should error (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-start-esm-wp-err-');
    appPath = scaffoldEsmAppWithDeps(tmpDir, 'esm-wp-err');
    enableWebpack(appPath);
    removeLocalCli(appPath);
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  it('should reject ESM projects when using the webpack compiler', () => {
    const { stderr, exitCode } = runNestRaw('build', appPath);

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(
      'webpack compiler does not support ESM projects',
    );
    expect(stderr).toContain('rspack');
  });
});
