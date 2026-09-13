import { existsSync } from 'fs';
import { createRequire } from 'module';
import { extname, join } from 'path';
import { pathToFileURL } from 'url';
import { resolveModulePath } from './is-module-available.js';

const require = createRequire(import.meta.url);

export async function loadBuilderConfig<T = any>(
  configPath: string,
  defaultPath: string,
  cwd = process.cwd(),
): Promise<T> {
  const pathToConfigFile = join(cwd, configPath);
  let resolvedPath = resolveModulePath(pathToConfigFile);

  if (!resolvedPath && existsSync(pathToConfigFile)) {
    resolvedPath = pathToConfigFile;
  }

  if (!resolvedPath) {
    if (configPath === defaultPath) {
      return ((_config: any) => ({})) as T;
    }
    require.resolve(pathToConfigFile);
  }

  if (extname(resolvedPath!) === '.json') {
    return require(resolvedPath!);
  }

  const imported = await import(pathToFileURL(resolvedPath!).href);
  let result = imported.default ?? imported;
  if (
    result &&
    typeof result === 'object' &&
    result.__esModule &&
    'default' in result
  ) {
    result = result.default;
  }
  return result;
}
