import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function isModuleAvailable(path: string): boolean {
  try {
    require.resolve(path);
    return true;
  } catch {
    return false;
  }
}
