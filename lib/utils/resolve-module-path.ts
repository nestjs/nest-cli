import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Resolves `path` through Node's module resolution, returning the resolved
 * filename or `undefined` when it cannot be found. Callers need the resolved
 * path itself (to decide how to load the file), not merely whether it exists.
 */
export function resolveModulePath(path: string): string | undefined {
  try {
    return require.resolve(path);
  } catch {
    return undefined;
  }
}
