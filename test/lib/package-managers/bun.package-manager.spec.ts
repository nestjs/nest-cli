import { join } from 'path';
import {
  PackageManagerCommands,
  BunPackageManager,
} from '../../../lib/package-managers';
import { BunRunner } from '../../../lib/runners/bun.runner';

jest.mock('../../../lib/runners/bun.runner');

describe('BunPackageManager', () => {
  let packageManager: BunPackageManager;
  beforeEach(() => {
    (BunRunner as any).mockClear();
    (BunRunner as any).mockImplementation(() => {
      return {
        run: (): Promise<void> => Promise.resolve(),
      };
    });
    packageManager = new BunPackageManager();
  });
  it('should be created', () => {
    expect(packageManager).toBeInstanceOf(BunPackageManager);
  });
  it('should have the correct cli commands', () => {
    const expectedValues: PackageManagerCommands = {
      install: 'install',
      add: 'add',
      update: 'install --force',
      remove: 'remove',
      saveFlag: '',
      saveDevFlag: '--development',
      silentFlag: '--silent',
    };
    expect(packageManager.cli).toMatchObject(expectedValues);
  });
  describe('install', () => {
    it('should use the proper command for installing', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dirName = '/tmp';
      const testDir = join(process.cwd(), dirName);
      packageManager.install(dirName, 'bun');
      expect(spy).toBeCalledWith('install --silent', true, testDir);
    });
  });
  describe('addProduction', () => {
    it('should use the proper command for adding production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';
      const command = `add ${dependencies
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
      const command = `add --development ${dependencies
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
      const command = `install --force ${dependencies.join(' ')}`;
      packageManager.updateProduction(dependencies);
      expect(spy).toBeCalledWith(command, true);
    });
  });
  describe('updateDevelopment', () => {
    it('should use the proper command for updating development dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const command = `install --force ${dependencies.join(' ')}`;
      packageManager.updateDevelopment(dependencies);
      expect(spy).toBeCalledWith(command, true);
    });
  });
  describe('upgradeProduction', () => {
    it('should use the proper command for upgrading production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';
      const uninstallCommand = `remove ${dependencies.join(' ')}`;

      const installCommand = `add ${dependencies
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
      const uninstallCommand = `remove --development ${dependencies.join(' ')}`;

      const installCommand = `add --development ${dependencies
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
