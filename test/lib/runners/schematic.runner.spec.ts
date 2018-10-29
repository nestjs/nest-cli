const fs = require('fs');
const path = require('path');
import { SchematicRunner } from '../../../lib/runners/schematic.runner';
import { sep } from 'path';

const withSep = (path: string) => path.replace('/', sep);

describe('SchematicRunner', () => {
  describe('findClosestSchematicsBinary', () => {
    it('it should return the correct path when called from globally installed package', () => {
      fs.existsSync = jest.fn();
      fs.existsSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const globalRunnersDirname = withSep('/home/test/.nvm/versions/node/v8.12.0/lib/node_modules/@nestjs/cli/lib/runners');

      const resolvedPath = SchematicRunner.findClosestSchematicsBinary(globalRunnersDirname);

      expect(resolvedPath)
        .toEqual(
          withSep('/home/test/.nvm/versions/node/v8.12.0/lib/node_modules/@nestjs/cli/node_modules/.bin/schematics')
        );
    });

    it('should return the correct path when called from locally installed package', () => {
      fs.existsSync = jest.fn();
      fs.existsSync
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      const localRunnersDirname = withSep('/home/test/project/node_modules/@nestjs/cli/lib/runners');

      const resolvedPath = SchematicRunner.findClosestSchematicsBinary(localRunnersDirname);

      expect(resolvedPath).toEqual(withSep('/home/test/project/node_modules/.bin/schematics'));
    });

    xit('should return the fallback path when neither expected global nor local paths are found', () => {
      // Need to mock __dirname in order to get this test to work.
      fs.existsSync = jest.fn();
      fs.existsSync
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      __dirname = path.join(sep, 'home', 'test', 'node_modules', '@nestjs', 'cli', 'lib', 'runners');

      const localRunnersDirname = withSep('/home/test/project/node_modules/@nestjs/cli/lib/runners');

      const resolvedPath = SchematicRunner.findClosestSchematicsBinary(localRunnersDirname);

      expect(resolvedPath).toEqual(withSep('/home/test/node_modules/@nestjs/cli/node_modules/.bin/schematics'));
    });
  })
});