import * as fs from 'fs';
import * as path from 'path';
import { SchematicRunner } from '../../../lib/runners/schematic.runner';

const withSep = (route: string) => path.resolve(route.split('/').join(path.sep));

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

  describe('findClosestSchematicsBinary', () => {
    it('it should return the correct path when called from globally installed package', () => {
      const existingPath = withSep('/home/test/.nvm/versions/node/v8.12.0/lib/node_modules/@nestjs/cli/node_modules/.bin/schematics');

      const globalRunnersDirname = withSep(
        '/home/test/.nvm/versions/node/v8.12.0/lib/node_modules/@nestjs/cli/lib/runners',
      );

      (fs as any).existsSync = jest.fn(existsSyncTrueForPathMock(existingPath));
      (SchematicRunner as any).prototype.constructor.getModulePaths = getModulePathsMock(globalRunnersDirname);

      const resolvedPath = SchematicRunner.findClosestSchematicsBinary();

      expect(resolvedPath).toEqual(existingPath);
    });

    it('should return the correct path when called from locally installed package', () => {
      const existingPath = withSep('/home/test/project/node_modules/.bin/schematics');

      const localRunnersDirname = withSep(
        '/home/test/project/node_modules/@nestjs/cli/lib/runners',
      );

      (fs as any).existsSync = jest.fn(existsSyncTrueForPathMock(existingPath));
      (SchematicRunner as any).prototype.constructor.getModulePaths = getModulePathsMock(localRunnersDirname);

      const resolvedPath = SchematicRunner.findClosestSchematicsBinary();

      expect(resolvedPath).toEqual(existingPath);
    });

    it('should throw when no path is found', () => {
      const globalRunnersDirname = withSep(
        '/home/test/.nvm/versions/node/v8.12.0/lib/node_modules/@nestjs/cli/lib/runners',
      );

      (fs as any).existsSync = jest.fn().mockReturnValue(false);
      (SchematicRunner as any).prototype.constructor.getModulePaths = getModulePathsMock(globalRunnersDirname);

      expect(SchematicRunner.findClosestSchematicsBinary).toThrow();
    });
  });
});
