import { join } from 'path';
import { YarnPackageManager } from "../../../lib/package-managers/yarn.package-manager";
import { YarnRunner } from "../../../lib/runners/yarn.runner";
import { PackageManagerCommands } from "../../../lib/package-managers/package-manager-commands";

jest.mock('../../../lib/runners/yarn.runner');

describe('YarnPackageManager', () => {
  let packageManager: YarnPackageManager;
  beforeEach(() => {
    (YarnRunner as any).mockClear();

    (YarnRunner as any).mockImplementation(() => {
      return {
        run: (): Promise<void> => Promise.resolve(),
      }
    });

    packageManager = new YarnPackageManager();
  });

  it('should be created', () => {
    expect(packageManager).toBeInstanceOf(YarnPackageManager);
  });

  it('should have the correct cli commands', () => {
    const expectedValues: PackageManagerCommands = {
      install: 'install',
      add: 'add',
      update: 'upgrade',
      remove: 'remove',
      saveFlag: '',
      saveDevFlag: '-D',
    };
    expect(packageManager.cli).toMatchObject(expectedValues);
  });

  describe('install', () => {
    it('should use the proper command for installing', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');
      const dirName = '/tmp';
      const testDir = join(process.cwd(), dirName);
      packageManager.install(dirName);
      expect(spy).toBeCalledWith(
        'install --silent',
        true,
        testDir,
      );
    });
  });

  describe('addProduction', () => {
    it('should use the proper command for adding production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');

      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';

      const command = `add ${ dependencies.map((dependency) => `${ dependency }@${ tag }`).join(' ') }`;

      packageManager.addProduction(dependencies, tag);

      expect(spy).toBeCalledWith(command, true);
    });
  });

  describe('addDevelopment', () => {
    it('should use the proper command for adding development dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');

      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';

      const command = `add -D ${ dependencies.map((dependency) => `${ dependency }@${ tag }`).join(' ') }`;

      packageManager.addDevelopment(dependencies, tag);

      expect(spy).toBeCalledWith(command, true);
    });
  });

  describe('updateProduction', () => {
    it('should use the proper command for updating production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');

      const dependencies = ['@nestjs/common', '@nestjs/core'];

      const command = `upgrade ${ dependencies.join(' ') }`;

      packageManager.updateProduction(dependencies);

      expect(spy).toBeCalledWith(command, true);
    });
  });

  describe('updateDevelopment', () => {
    it('should use the proper command for updating development dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');

      const dependencies = ['@nestjs/common', '@nestjs/core'];

      const command = `upgrade ${ dependencies.join(' ') }`;

      packageManager.updateDevelopement(dependencies);

      expect(spy).toBeCalledWith(command, true);
    });
  });

  describe('upgradeProduction', () => {
    it('should use the proper command for upgrading production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');

      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';

      const uninstallCommand = `remove ${ dependencies.join(' ') }`;

      const installCommand = `add ${ dependencies.map((dependency) => `${ dependency }@${ tag }`).join(' ') }`;

      return packageManager.upgradeProduction(dependencies, tag)
        .then(() => {
          expect(spy.mock.calls).toEqual([
            [uninstallCommand, true],
            [installCommand, true]
          ]);
        });
    });
  });

  describe('upgradeDevelopment', () => {
    it('should use the proper command for upgrading production dependencies', () => {
      const spy = jest.spyOn((packageManager as any).runner, 'run');

      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = '5.0.0';

      const uninstallCommand = `remove -D ${ dependencies.join(' ') }`;

      const installCommand = `add -D ${ dependencies.map((dependency) => `${ dependency }@${ tag }`).join(' ') }`;

      return packageManager.upgradeDevelopement(dependencies, tag)
        .then(() => {
          expect(spy.mock.calls).toEqual([
            [uninstallCommand, true],
            [installCommand, true]
          ]);
        });
    });
  });
});