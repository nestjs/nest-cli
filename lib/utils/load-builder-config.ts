import { existsSync } from 'fs';
import { createRequire } from 'module';
import { extname, join } from 'path';
import { pathToFileURL } from 'url';
import { resolveModulePath } from './resolve-module-path.js';

const require = createRequire(import.meta.url);

/**
 * Loads a builder (webpack/rspack) configuration file, which may be CommonJS,
 * native ESM, or JSON. When `configPath` is the builder's default filename and
 * no such file exists, the project simply has no overrides, so an identity
 * factory is returned; an explicitly configured path that cannot be found is
 * an error.
 */
export async function loadBuilderConfig<T = any>(
  configPath: string,
  defaultPath: string,
  cwd = process.cwd(),
): Promise<T> {
  const pathToConfigFile = join(cwd, configPath);
  // `require.resolve` handles extensionless and directory-index paths, but
  // does not know about ESM-only extensions, hence the `existsSync` fallback.
  const resolvedPath =
    resolveModulePath(pathToConfigFile) ??
    (existsSync(pathToConfigFile) ? pathToConfigFile : undefined);

  if (!resolvedPath) {
    if (configPath === defaultPath) {
      return ((_config: any) => ({})) as T;
    }
    throw new Error(
      `Could not find the builder configuration file "${configPath}".`,
    );
  }

  if (extname(resolvedPath) === '.json') {
    return require(resolvedPath);
  }

  const imported = await import(pathToFileURL(resolvedPath).href);
  const result = imported.default ?? imported;
  // A CommonJS file compiled from TypeScript exposes its real export under a
  // second `default`, behind the `__esModule` marker Node preserves as-is.
  return (isTranspiledEsModule(result) ? result.default : result) as T;
}

function isTranspiledEsModule(
  value: unknown,
): value is { default: unknown; __esModule: true } {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__esModule === true &&
    'default' in value
  );
}
