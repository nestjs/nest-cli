import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isMissingLazyImport,
  lazyImports,
} from '../../../../lib/compiler/defaults/lazy-imports.js';

describe('lazy imports', () => {
  let projectDir: string;

  const install = (name: string, files: string[]) => {
    const dir = join(projectDir, 'node_modules', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name,
        version: '1.0.0',
        type: 'module',
        exports: { '.': './index.js', './*.js': './*.js', './*': './*.js' },
      }),
    );
    writeFileSync(join(dir, 'index.js'), 'export {};');
    for (const file of files) {
      writeFileSync(join(dir, file), 'export {};');
    }
  };

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'nest-cli-lazy-'));
    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('should list the submodules with and without the .js suffix', () => {
    expect(lazyImports).toEqual(
      expect.arrayContaining([
        '@nestjs/microservices/microservices-module',
        '@nestjs/microservices/microservices-module.js',
        '@nestjs/websockets/socket-module',
        '@nestjs/websockets/socket-module.js',
      ]),
    );
  });

  it.each([
    '@nestjs/microservices/microservices-module.js',
    '@nestjs/websockets/socket-module.js',
  ])('should ignore %s when the package is not installed', (resource) => {
    expect(isMissingLazyImport(resource)).toBe(true);
  });

  it.each([
    ['@nestjs/microservices', 'microservices-module.js'],
    ['@nestjs/websockets', 'socket-module.js'],
  ])('should keep %s submodule when the package is installed', (pkg, file) => {
    install(pkg, [file]);

    expect(isMissingLazyImport(`${pkg}/${file}`)).toBe(false);
  });

  it('should never ignore imports outside the list', () => {
    expect(isMissingLazyImport('some-missing-package')).toBe(false);
  });
});
