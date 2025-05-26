import { join } from 'path';
import {
  BunPackageManager,
  PackageManagerCommands,
} from '../../../lib/package-managers';
import { BunRunner } from '../../../lib/runners/bun.runner';

// Mock the BunRunner to control its behavior during tests
jest.mock('../../../lib/runners/bun.runner');

/**
 * Test suite for the BunPackageManager class.
 */
describe('BunPackageManager', () => {
  let packageManager: BunPackageManager;
  let mockRun: jest.Mock;

  beforeEach(() => {
    (BunRunner as any).mockClear();
    mockRun = jest.fn().mockResolvedValue(undefined);
    (BunRunner as any).mockImplementation(() => {
      return {
        run: mockRun,
        rawFullCommand: jest.fn().mockImplementation((cmd: string) => `bun ${cmd}`),
      };
    });
    packageManager = new BunPackageManager();
  });

  it('should be created', () => {
    // Ensures the package manager instance is correctly created.
    expect(packageManager).toBeInstanceOf(BunPackageManager);
  });

  it('should have the correct cli commands', () => {
    // Verifies that the CLI command structure for Bun is accurately defined.
    // These commands are used by the AbstractPackageManager to execute package management operations.
    const expectedValues: PackageManagerCommands = {
      install: 'install',
      add: 'add',
      update: 'update',
      remove: 'remove',
      saveFlag: '',
      saveDevFlag: '--development',
      silentFlag: '--silent',
    };
    expect(packageManager.cli).toMatchObject(expectedValues);
  });

  /**
   * Tests for the `install` method.
   */
  describe('install', () => {
    it('should use the correct command for installing dependencies', async () => {
      const dirName = '/tmp';
      const testDir = join(process.cwd(), dirName);
      await packageManager.install(dirName, 'bun');

      // AbstractPackageManager appends the silentFlag to the install command.
      // For Bun: "install" + " " + "--silent"
      expect(mockRun).toHaveBeenCalledWith('install --silent', true, testDir);
    });
  });

  /**
   * Tests for the `addProduction` method.
   */
  describe('addProduction', () => {
    it('should use the correct command for adding production dependencies', async () => {
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = 'latest';

      // AbstractPackageManager: `this.cli.add` + `this.cli.saveFlag` (which is empty for Bun)
      // For Bun: "add dep1@tag dep2@tag"
      const command = `add ${dependencies
        .map((dependency) => `${dependency}@${tag}`)
        .join(' ')}`;
      await packageManager.addProduction(dependencies, tag);
      expect(mockRun).toHaveBeenCalledWith(command.trim(), true);
    });
  });

  /**
   * Tests for the `addDevelopment` method.
   */
  describe('addDevelopment', () => {
    it('should use the correct command for adding development dependencies', async () => {
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      const tag = 'latest';

      // AbstractPackageManager: `this.cli.add` + `this.cli.saveDevFlag`
      // For Bun: "add --development dep1@tag dep2@tag"
      const command = `add --development ${dependencies
        .map((dependency) => `${dependency}@${tag}`)
        .join(' ')}`;
      await packageManager.addDevelopment(dependencies, tag);
      expect(mockRun).toHaveBeenCalledWith(command, true);
    });
  });

  /**
   * Tests for the `updateProduction` method.
   */
  describe('updateProduction', () => {
    it('should use the correct command for updating production dependencies', async () => {
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      // AbstractPackageManager: `this.cli.update` + dependencies
      // For Bun: "update dep1 dep2"
      const command = `update ${dependencies.join(' ')}`;
      await packageManager.updateProduction(dependencies);
      expect(mockRun).toHaveBeenCalledWith(command, true);
    });
  });

  /**
   * Tests for the `updateDevelopment` method.
   */
  describe('updateDevelopment', () => {
    it('should use the correct command for updating development dependencies', async () => {
      const dependencies = ['@types/node', 'typescript'];
      // AbstractPackageManager: `this.cli.update` + dependencies
      // For Bun: "update dep1 dep2" (Bun's update doesn't typically differentiate between prod/dev for the command itself)
      const command = `update ${dependencies.join(' ')}`;
      await packageManager.updateDevelopment(dependencies);
      expect(mockRun).toHaveBeenCalledWith(command, true);
    });
  });

  /**
   * Tests for the `upgradeProduction` method.
   * This method first deletes then adds the dependencies.
   */
  describe('upgradeProduction', () => {
    it('should use correct commands for upgrading production dependencies', async () => {
      const dependencies = ['@nestjs/common'];
      const tag = 'next';

      // Expected delete command: "remove @nestjs/common" (saveFlag is empty for Bun)
      const deleteCommand = `remove ${dependencies.join(' ')}`;
      // Expected add command: "add @nestjs/common@next"
      const addCommand = `add ${dependencies
        .map((dep) => `${dep}@${tag}`)
        .join(' ')}`;

      await packageManager.upgradeProduction(dependencies, tag);
      expect(mockRun).toHaveBeenCalledWith(deleteCommand.trim(), true);
      expect(mockRun).toHaveBeenCalledWith(addCommand.trim(), true);
    });
  });

  /**
   * Tests for the `upgradeDevelopment` method.
   * This method first deletes then adds the dependencies with dev flag.
   */
  describe('upgradeDevelopment', () => {
    it('should use correct commands for upgrading development dependencies', async () => {
      const dependencies = ['eslint'];
      const tag = 'latest';

      // Expected delete command: "remove --development eslint"
      const deleteCommand = `remove --development ${dependencies.join(' ')}`;
      // Expected add command: "add --development eslint@latest"
      const addCommand = `add --development ${dependencies
        .map((dep) => `${dep}@${tag}`)
        .join(' ')}`;

      await packageManager.upgradeDevelopment(dependencies, tag);
      expect(mockRun).toHaveBeenCalledWith(deleteCommand, true);
      expect(mockRun).toHaveBeenCalledWith(addCommand, true);
    });
  });

  /**
   * Tests for the `deleteProduction` method.
   */
  describe('deleteProduction', () => {
    it('should use the correct command for deleting production dependencies', async () => {
      const dependencies = ['@nestjs/common', '@nestjs/core'];
      // AbstractPackageManager: `this.cli.remove` (saveFlag is empty for Bun) + dependencies
      // For Bun: "remove dep1 dep2"
      const command = `remove ${dependencies.join(' ')}`;
      await packageManager.deleteProduction(dependencies);
      expect(mockRun).toHaveBeenCalledWith(command.trim(), true);
    });
  });

  /**
   * Tests for the `deleteDevelopment` method.
   */
  describe('deleteDevelopment', () => {
    it('should use the correct command for deleting development dependencies', async () => {
      const dependencies = ['@types/jest', 'ts-node'];
      // AbstractPackageManager: `this.cli.remove` + `this.cli.saveDevFlag` + dependencies
      // For Bun: "remove --development dep1 dep2"
      const command = `remove --development ${dependencies.join(' ')}`;
      await packageManager.deleteDevelopment(dependencies);
      expect(mockRun).toHaveBeenCalledWith(command, true);
    });
  });
});