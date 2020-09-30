import * as fs from 'fs';
import * as path from 'path';
import { SchematicRunner } from '../../../lib/runners/schematic.runner';

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
      it('it should return the same array as the module.paths module-local field', () => {
        const realModulePath = module.paths;
        const mockedModulePath = getModulePathsMock(__filename)();

        expect(mockedModulePath).toEqual(realModulePath);
      });
    });
  });
});
