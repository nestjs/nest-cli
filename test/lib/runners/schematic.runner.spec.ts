import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);

const withSep = (route: string) =>
  path.resolve(route.split('/').join(path.sep));

const existsSyncTrueForPathMock = (pathToExist: string) => {
  pathToExist = withSep(pathToExist);
  return (pathToCheck: string) => pathToCheck === pathToExist;
};

const getModulePathsMock = (fullPath: string) => {
  const moduleLoaderPaths: string[] = [];
  const fullPathBits = fullPath.split(path.sep);

  while (--fullPathBits.length !== 0) {
    if (fullPathBits[fullPathBits.length - 1] === 'node_modules') {
      continue;
    }

    const modulePath = [...fullPathBits, 'node_modules'].join(path.sep);

    moduleLoaderPaths.push(modulePath);
  }

  return () => moduleLoaderPaths;
};

describe('SchematicRunner', () => {
  describe('Mocking Checks', () => {
    describe('existsSyncTrueForPathMock', () => {
      it('it should return true only for one specific path', () => {
        const truePath = withSep('/this/path/exists');
        const wrongPath = withSep('/this/path/doesnt/exist');
        const existsSync = existsSyncTrueForPathMock(truePath);

        expect(existsSync(truePath)).toBe(true);
        expect(existsSync(wrongPath)).toBe(false);
      });
    });

    describe('getModulePathsMock', () => {
      it('it should return a subset of the resolve paths', () => {
        const realModulePath = require.resolve.paths('@angular-devkit/schematics-cli') ?? [];
        const mockedModulePath = getModulePathsMock(__filename)();

        // require.resolve.paths() may include extra global paths
        // (e.g. ~/.node_modules, ~/.node_libraries) that the mock doesn't generate.
        // Verify the mock's paths are all contained in the real paths.
        for (const p of mockedModulePath) {
          expect(realModulePath).toContain(p);
        }
      });
    });
  });
});
