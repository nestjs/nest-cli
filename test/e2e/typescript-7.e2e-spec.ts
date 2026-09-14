import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTempDir,
  fileExists,
  npmInstall,
  readFileContent,
  removeLocalCli,
  removeTempDir,
  runNest,
  runNestRaw,
  scaffoldAppWithDeps,
  writeFileContent,
} from './helpers.js';

/**
 * Runs the `tsc` builder against the native TypeScript compiler
 * (`typescript@next`, 7.1+). The nightly moves daily, so this suite skips
 * itself when the prerelease cannot be installed or no longer exposes the
 * program API, rather than failing the whole e2e job on upstream churn.
 */
describe('Build Command with TypeScript 7 (e2e)', () => {
  let tmpDir: string;
  let appPath: string;
  let supported = false;

  beforeAll(() => {
    tmpDir = createTempDir('nest-e2e-ts7-');
    appPath = scaffoldAppWithDeps(tmpDir, 'ts7-app');
    try {
      npmInstall(appPath, '--save-dev typescript@next');
    } catch {
      return;
    }
    // The scaffolded app ships the published CLI; the one under test must
    // run, so the local copy goes after the last `npm install`.
    removeLocalCli(appPath);
    // TypeScript 7 requires an explicit rootDir (TS5011).
    const tsconfigPath = path.join(appPath, 'tsconfig.json');
    const tsconfig = JSON.parse(readFileContent(tsconfigPath));
    tsconfig.compilerOptions.rootDir = './src';
    delete tsconfig.compilerOptions.baseUrl;
    writeFileContent(tsconfigPath, JSON.stringify(tsconfig, null, 2));

    supported = execSync(
      `node -e "const m = require('typescript/unstable/sync'); process.stdout.write(String('createProgram' in m.API.prototype))"`,
      { cwd: appPath, encoding: 'utf-8' },
    ).includes('true');
  });

  afterAll(() => {
    removeTempDir(tmpDir);
  });

  it('builds through the native API and produces runnable output', (ctx) => {
    if (!supported) {
      return ctx.skip();
    }
    fs.rmSync(path.join(appPath, 'dist'), { recursive: true, force: true });

    runNest('build', appPath);

    const main = path.join(appPath, 'dist', 'main.js');
    expect(fileExists(main)).toBe(true);
    expect(fileExists(path.join(appPath, 'dist', 'app.module.js'))).toBe(true);
    expect(readFileContent(main)).toContain('NestFactory');
    // Syntax-check the emitted entry point without starting the server.
    expect(() =>
      execSync(`node --check "${main}"`, { cwd: appPath, stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('reports type errors and exits with 1', (ctx) => {
    if (!supported) {
      return ctx.skip();
    }
    const badFile = path.join(appPath, 'src', 'bad.ts');
    writeFileContent(badFile, 'export const bad: number = "x";\n');
    try {
      const { exitCode, stderr } = runNestRaw('build', appPath);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('TS2322');
    } finally {
      fs.rmSync(badFile, { force: true });
    }
  });

  it('rejects compiler plugins with an actionable error', (ctx) => {
    if (!supported) {
      return ctx.skip();
    }
    const cliConfigPath = path.join(appPath, 'nest-cli.json');
    const original = readFileContent(cliConfigPath);
    const cliConfig = JSON.parse(original);
    cliConfig.compilerOptions = {
      ...cliConfig.compilerOptions,
      plugins: ['@nestjs/swagger'],
    };
    writeFileContent(cliConfigPath, JSON.stringify(cliConfig, null, 2));
    try {
      const { exitCode, stderr } = runNestRaw('build', appPath);
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Compiler plugins');
    } finally {
      writeFileContent(cliConfigPath, original);
    }
  });
});
