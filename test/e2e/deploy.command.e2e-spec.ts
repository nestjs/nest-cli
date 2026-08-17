import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, removeTempDir, runNestRaw } from './helpers.js';

/**
 * `nest deploy` is a thin pass-through to `mau deploy`. A stub @nestjs/mau is
 * installed into the project so the forwarded argv can be observed without
 * reaching the real deployment service.
 */
describe('Deploy Command (e2e)', () => {
  let tmpDir: string;

  const writeProject = () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'deploy-e2e', version: '1.0.0' }),
      'utf8',
    );
  };

  const installStubMau = () => {
    const packageDir = path.join(tmpDir, 'node_modules', '@nestjs', 'mau');
    fs.mkdirSync(path.join(packageDir, 'bin'), { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, 'package.json'),
      JSON.stringify({
        name: '@nestjs/mau',
        version: '0.0.0-stub',
        bin: { mau: 'bin/mau.js' },
      }),
      'utf8',
    );
    fs.writeFileSync(
      path.join(packageDir, 'bin', 'mau.js'),
      'console.log("MAU_ARGV:" + JSON.stringify(process.argv.slice(2)));\n',
      'utf8',
    );
  };

  const forwardedArgv = (stdout: string): string[] => {
    const line = stdout.split('\n').find((l) => l.startsWith('MAU_ARGV:'));
    return line ? JSON.parse(line.replace('MAU_ARGV:', '')) : [];
  };

  beforeEach(() => {
    tmpDir = createTempDir('nest-e2e-deploy-');
    writeProject();
  });

  afterEach(() => {
    removeTempDir(tmpDir);
  });

  describe('when @nestjs/mau is installed', () => {
    beforeEach(() => {
      installStubMau();
    });

    it('invokes "mau deploy"', () => {
      const { stdout, exitCode } = runNestRaw('deploy', tmpDir);

      expect(exitCode).toBe(0);
      expect(forwardedArgv(stdout)).toEqual(['deploy']);
    });

    it('forwards mau options verbatim', () => {
      const { stdout, exitCode } = runNestRaw(
        'deploy --force --env=production -y',
        tmpDir,
      );

      expect(exitCode).toBe(0);
      expect(forwardedArgv(stdout)).toEqual([
        'deploy',
        '--force',
        '--env=production',
        '-y',
      ]);
    });
  });

  describe('when @nestjs/mau is missing', () => {
    it('exits non-zero and explains how to install it', () => {
      // execSync gives the child no TTY, so the CLI must print instructions
      // rather than waiting on a confirmation nobody can answer.
      const { stdout, stderr, exitCode } = runNestRaw('deploy', tmpDir);
      const output = stdout + stderr;

      expect(exitCode).toBe(1);
      expect(output).toContain('@nestjs/mau');
      expect(output).toContain('npm install --save-dev @nestjs/mau');
    });
  });

  it('is listed in the CLI help output', () => {
    const { stdout } = runNestRaw('--help', tmpDir);

    expect(stdout).toContain('deploy');
  });
});
