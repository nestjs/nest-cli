import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function resolveModulePath(path: string): string | undefined {
  try {
    return require.resolve(path);
  } catch {
    return undefined;
  }
}

export function isModuleAvailable(path: string): boolean {
  return !!resolveModulePath(path);
}
