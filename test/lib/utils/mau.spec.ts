import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAU_PACKAGE_NAME, findMauBinary } from '../../../lib/utils/mau.js';

describe('findMauBinary', () => {
  let projectDir: string;
  let packageDir: string;

  const writePackage = (
    packageJson: Record<string, unknown>,
    binRelativePath?: string,
  ) => {
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify(packageJson),
      'utf8',
    );
    if (binRelativePath) {
      const binPath = join(packageDir, binRelativePath);
      mkdirSync(join(binPath, '..'), { recursive: true });
      writeFileSync(binPath, '#!/usr/bin/env node\n', 'utf8');
    }
  };

  beforeEach(() => {
    // realpath: require.resolve reports resolved paths, and on macOS the
    // temp directory is reached through a /var -> /private/var symlink.
    projectDir = realpathSync(mkdtempSync(join(tmpdir(), 'nest-mau-')));
    packageDir = join(
      projectDir,
      'node_modules',
      ...MAU_PACKAGE_NAME.split('/'),
    );
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('returns undefined when the package is not installed', () => {
    expect(findMauBinary(projectDir)).toBeUndefined();
  });

  it('resolves the executable from the package bin map', () => {
    writePackage(
      { name: MAU_PACKAGE_NAME, version: '0.2.6', bin: { mau: 'bin/mau.js' } },
      'bin/mau.js',
    );

    expect(findMauBinary(projectDir)).toBe(join(packageDir, 'bin', 'mau.js'));
  });

  it('supports a bin field declared as a plain string', () => {
    writePackage(
      { name: MAU_PACKAGE_NAME, version: '0.2.6', bin: 'dist/cli.js' },
      'dist/cli.js',
    );

    expect(findMauBinary(projectDir)).toBe(join(packageDir, 'dist', 'cli.js'));
  });

  it('falls back to the first entry when the bin map is named differently', () => {
    writePackage(
      {
        name: MAU_PACKAGE_NAME,
        version: '0.2.6',
        bin: { 'mau-cli': 'bin/other.js' },
      },
      'bin/other.js',
    );

    expect(findMauBinary(projectDir)).toBe(join(packageDir, 'bin', 'other.js'));
  });

  it('returns undefined when the package declares no bin', () => {
    writePackage({ name: MAU_PACKAGE_NAME, version: '0.2.6' });

    expect(findMauBinary(projectDir)).toBeUndefined();
  });

  it('returns undefined when the declared executable is missing on disk', () => {
    // A partially extracted install must not produce a path that cannot run.
    writePackage({
      name: MAU_PACKAGE_NAME,
      version: '0.2.6',
      bin: { mau: 'bin/mau.js' },
    });

    expect(findMauBinary(projectDir)).toBeUndefined();
  });

  it('returns undefined when the package manifest is unreadable', () => {
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), '{ not json', 'utf8');

    expect(findMauBinary(projectDir)).toBeUndefined();
  });
});
