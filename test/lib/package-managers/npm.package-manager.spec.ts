import { join } from 'path';
import {
  NpmPackageManager,
  PackageManagerCommands,
} from '../../../lib/package-managers';
import { NpmRunner } from '../../../lib/runners/npm.runner';

jest.mock('../../../lib/runners/npm.runner');

describe('NpmPackageManager', () => {
  let packageManager: NpmPackageManager;
  beforeEach(() => {
    (NpmRunner as any).mockClear();
    (NpmRunner as any).mockImplementation(() => {
      return {
        run: (): Promise<void> => Promise.resolve(),
      };
    });
    packageManager = new NpmPackageManager();
  });
  it('should be created', () => {
    expect(packageManager).toBeInstanceOf(NpmPackageManager);
  });
  it('should have the correct cli commands', () => {
    const expectedValues: PackageManagerCommands = {
      install: 'install',
      add: 'install',
      update: 'update',
      remove: 'uninstall',
      saveFlag: '--save',
      saveDevFlag: '--save-dev',
      silentFlag: '--silent',
    };
    expect(packageManager.cli).toMatchObject(expectedValues);
  });
  describe('install', () => {
    it('should use the proper command for installing', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dirName = '/tmp';
      const testDir = join(process.cwd(), dirName);
      packageManager.install(dirName, 'npm');
      expect(spy).toBeCalledWith('install --silent', true, testDir);
    });
  });
  describe('addProduction', () => {
    it('should use the proper command for adding production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';
      const command = `install --save ${dependencies
        .map((dependency) => `${dependency}@${tag}`)
        .join(' ')}`;
      packageManager.addProduction(dependencies, tag);
      expect(spy).toBeCalledWith(command, true);
    });
  });
  describe('addDevelopment', () => {
    it('should use the proper command for adding development dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';
      const command = `install --save-dev ${dependencies
        .map((dependency) => `${dependency}@${tag}`)
        .join(' ')}`;
      packageManager.addDevelopment(dependencies, tag);
      expect(spy).toBeCalledWith(command, true);
    });
  });
  describe('updateProduction', () => {
    it('should use the proper command for updating production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const command = `update ${dependencies.join(' ')}`;
      packageManager.updateProduction(dependencies);
      expect(spy).toBeCalledWith(command, true);
    });
  });
  describe('updateDevelopment', () => {
    it('should use the proper command for updating development dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const command = `update ${dependencies.join(' ')}`;
      packageManager.updateDevelopment(dependencies);
      expect(spy).toBeCalledWith(command, true);
    });
  });
  describe('upgradeProduction', () => {
    it('should use the proper command for upgrading production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';
      const uninstallCommand = `uninstall --save ${dependencies.join(' ')}`;

      const installCommand = `install --save ${dependencies
        .map((dependency) => `${dependency}@${tag}`)
        .join(' ')}`;

      return packageManager.upgradeProduction(dependencies, tag).then(() => {
        expect(spy.mock.calls).toEqual([
          [uninstallCommand, true],
          [installCommand, true],
        ]);
      });
    });
  });
  describe('upgradeDevelopment', () => {
    it('should use the proper command for upgrading production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';
      const uninstallCommand = `uninstall --save-dev ${dependencies.join(' ')}`;

      const installCommand = `install --save-dev ${dependencies
        .map((dependency) => `${dependency}@${tag}`)
        .join(' ')}`;

      return packageManager.upgradeDevelopment(dependencies, tag).then(() => {
        expect(spy.mock.calls).toEqual([
          [uninstallCommand, true],
          [installCommand, true],
        ]);
      });
    });
  });
});
