import { createRequire } from 'node:module';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rspack } from '@rspack/core';
import { afterEach, expect, it } from 'vitest';
import { rspackDefaultsFactory } from '../../../../lib/compiler/defaults/rspack-defaults.js';
import { MultiNestCompilerPlugins } from '../../../../lib/compiler/plugins/plugins-loader.js';

const tempDirs: string[] = [];
const require = createRequire(import.meta.url);

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function buildCjsEntry(source: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'nest-rspack-cjs-'));
  tempDirs.push(dir);
  const sourceRoot = join(dir, 'apps', 'admin', 'src');
  mkdirSync(sourceRoot, { recursive: true });
  writeFileSync(join(sourceRoot, 'main.ts'), source);
  const tsconfigPath = join(dir, 'tsconfig.json');
  writeFileSync(
    tsconfigPath,
    JSON.stringify({ compilerOptions: { module: 'commonjs' } }),
  );

  const plugins: MultiNestCompilerPlugins = {
    beforeHooks: [],
    afterHooks: [],
    afterDeclarationsHooks: [],
    readonlyVisitors: [],
  };
  const config = rspackDefaultsFactory(
    sourceRoot,
    join('apps', 'admin', 'src'),
    'main',
    false,
    tsconfigPath,
    plugins,
  );
  config.output.path = join(dir, 'dist');
  config.plugins = [];

  await new Promise<void>((resolve, reject) => {
    rspack(config, (error, stats) => {
      if (error || !stats || stats.hasErrors()) {
        reject(
          error ??
            new Error(stats?.toString('errors-only') ?? 'No compilation stats'),
        );
      } else {
        resolve();
      }
    });
  });
  return join(dir, 'dist', 'apps', 'admin', 'src', 'main.js');
}

it('preserves a named export in a CommonJS entry', async () => {
  const output = await buildCjsEntry('export const handler = () => "ready";');
  expect(require(output).handler()).toBe('ready');
});

it('keeps an entry with no exports loadable', async () => {
  const output = await buildCjsEntry(
    'globalThis.nestRspackCjsEntryLoaded = true;',
  );
  expect(readFileSync(output, 'utf8')).toContain('nestRspackCjsEntryLoaded');
  expect(() => require(output)).not.toThrow();
});
