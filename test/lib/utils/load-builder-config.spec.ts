import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadBuilderConfig } from '../../../lib/utils/load-builder-config.js';

describe('loadBuilderConfig', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'nest-builder-config-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  it('should return identity function when default config file does not exist', async () => {
    const config = await loadBuilderConfig(
      'rspack.config.js',
      'rspack.config.js',
      projectRoot,
    );

    expect(typeof config).toBe('function');
    expect(config({ entry: 'main.js' })).toEqual({});
  });

  it('should throw when custom config file does not exist', async () => {
    await expect(
      loadBuilderConfig(
        'custom.rspack.config.js',
        'rspack.config.js',
        projectRoot,
      ),
    ).rejects.toThrow();
  });

  it('should load ESM config file with default export function', async () => {
    const filePath = join(projectRoot, 'rspack.config.mjs');
    writeFileSync(
      filePath,
      'export default function (options) { return { ...options, loadedFromEsm: true }; }',
    );

    const config = await loadBuilderConfig(
      'rspack.config.mjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(typeof config).toBe('function');
    expect(config({})).toEqual({ loadedFromEsm: true });
  });

  it('should load ESM config file with default export plain object', async () => {
    const filePath = join(projectRoot, 'rspack.config.mjs');
    writeFileSync(
      filePath,
      'export default { entry: "src/main.ts", output: { path: "dist" } };',
    );

    const config = await loadBuilderConfig(
      'rspack.config.mjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(config).toEqual({
      entry: 'src/main.ts',
      output: { path: 'dist' },
    });
  });

  it('should load ESM config file with default export array (multi-compiler)', async () => {
    const filePath = join(projectRoot, 'rspack.config.mjs');
    writeFileSync(
      filePath,
      'export default [{ name: "client" }, (options) => ({ ...options, name: "server" })];',
    );

    const config = await loadBuilderConfig(
      'rspack.config.mjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(Array.isArray(config)).toBe(true);
    expect(config[0]).toEqual({ name: 'client' });
    expect(typeof config[1]).toBe('function');
    expect(config[1]({})).toEqual({ name: 'server' });
  });

  it('should load ESM config module when only named exports are present', async () => {
    const filePath = join(projectRoot, 'rspack.config.mjs');
    writeFileSync(filePath, 'export const entry = "src/main.ts";');

    const config = await loadBuilderConfig(
      'rspack.config.mjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(config.entry).toBe('src/main.ts');
  });

  it('should load CommonJS config file with function export', async () => {
    const filePath = join(projectRoot, 'rspack.config.cjs');
    writeFileSync(
      filePath,
      'module.exports = function (options) { return { ...options, loadedFromCjs: true }; };',
    );

    const config = await loadBuilderConfig(
      'rspack.config.cjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(typeof config).toBe('function');
    expect(config({})).toEqual({ loadedFromCjs: true });
  });

  it('should load CommonJS config file with object export', async () => {
    const filePath = join(projectRoot, 'rspack.config.cjs');
    writeFileSync(
      filePath,
      'module.exports = { entry: "src/main.ts", cjs: true };',
    );

    const config = await loadBuilderConfig(
      'rspack.config.cjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(config).toEqual({ entry: 'src/main.ts', cjs: true });
  });

  it('should unwrap TypeScript-compiled CommonJS config with __esModule', async () => {
    const filePath = join(projectRoot, 'rspack.config.cjs');
    writeFileSync(
      filePath,
      'exports.__esModule = true; exports.default = function (options) { return { ...options, fromTs: true }; };',
    );

    const config = await loadBuilderConfig(
      'rspack.config.cjs',
      'rspack.config.js',
      projectRoot,
    );

    expect(typeof config).toBe('function');
    expect(config({})).toEqual({ fromTs: true });
  });

  it('should load JSON config file', async () => {
    const filePath = join(projectRoot, 'rspack.config.json');
    writeFileSync(filePath, JSON.stringify({ entry: 'main.ts', json: true }));

    const config = await loadBuilderConfig(
      'rspack.config.json',
      'rspack.config.js',
      projectRoot,
    );

    expect(config).toEqual({ entry: 'main.ts', json: true });
  });

  it('should resolve extensionless config file path', async () => {
    mkdirSync(join(projectRoot, 'config'), { recursive: true });
    writeFileSync(
      join(projectRoot, 'config', 'rspack.js'),
      'module.exports = { resolvedFromExtensionless: true };',
    );

    const config = await loadBuilderConfig(
      'config/rspack',
      'rspack.config.js',
      projectRoot,
    );

    expect(config).toEqual({ resolvedFromExtensionless: true });
  });

  it('should resolve directory index config file path', async () => {
    mkdirSync(join(projectRoot, 'config', 'rspack'), { recursive: true });
    writeFileSync(
      join(projectRoot, 'config', 'rspack', 'index.js'),
      'module.exports = { resolvedFromDirectoryIndex: true };',
    );

    const config = await loadBuilderConfig(
      'config/rspack',
      'rspack.config.js',
      projectRoot,
    );

    expect(config).toEqual({ resolvedFromDirectoryIndex: true });
  });
});
