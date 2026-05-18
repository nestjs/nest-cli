import { join } from 'path';
import * as fsPromises from 'fs/promises';
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AbstractPackageManager } from '../../../lib/package-managers/abstract.package-manager.js';
import { PackageManagerCommands } from '../../../lib/package-managers/package-manager-commands.js';
import { AbstractRunner } from '../../../lib/runners/abstract.runner.js';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

const spinnerMock = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};

vi.mock('ora', () => ({
  default: vi.fn(() => spinnerMock),
}));

class TestPackageManager extends AbstractPackageManager {
  public get name(): string {
    return 'TEST';
  }

  public get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'add',
      update: 'update',
      remove: 'remove',
      saveFlag: '--save',
      saveDevFlag: '--save-dev',
      silentFlag: '--silent',
    };
  }
}

function createRunner(overrides: Partial<AbstractRunner> = {}): {
  runner: AbstractRunner;
  runMock: Mock;
  rawFullCommandMock: Mock;
} {
  const runMock = vi.fn().mockResolvedValue(null);
  const rawFullCommandMock = vi.fn(
    (command: string) => `binary args ${command}`,
  );
  const runner = {
    run: runMock,
    rawFullCommand: rawFullCommandMock,
    ...overrides,
  } as unknown as AbstractRunner;
  return { runner, runMock, rawFullCommandMock };
}

describe('AbstractPackageManager', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    spinnerMock.start.mockClear();
    spinnerMock.succeed.mockClear();
    spinnerMock.fail.mockClear();
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('install', () => {
    it('should run install with silent flag and report success', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.install('my-app', 'npm');

      expect(runMock).toHaveBeenCalledWith(
        'install --silent',
        true,
        join(process.cwd(), 'my-app'),
      );
      expect(spinnerMock.start).toHaveBeenCalled();
      expect(spinnerMock.succeed).toHaveBeenCalled();
      expect(spinnerMock.fail).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should normalize the directory before passing to the runner', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.install('My App', 'npm');

      expect(runMock).toHaveBeenCalledWith(
        'install --silent',
        true,
        join(process.cwd(), 'my-app'),
      );
    });

    it('should fail spinner and log the failed command when install fails', async () => {
      const runMock = vi.fn().mockRejectedValue(new Error('install failed'));
      const rawFullCommandMock = vi.fn(() => 'npm install');
      const runner = {
        run: runMock,
        rawFullCommand: rawFullCommandMock,
      } as unknown as AbstractRunner;
      const packageManager = new TestPackageManager(runner);

      await packageManager.install('my-app', 'npm');

      expect(spinnerMock.fail).toHaveBeenCalled();
      expect(spinnerMock.succeed).not.toHaveBeenCalled();
      expect(rawFullCommandMock).toHaveBeenCalledWith('install');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('version', () => {
    it('should resolve to the runner output', async () => {
      const runMock = vi.fn().mockResolvedValue('1.2.3');
      const runner = {
        run: runMock,
        rawFullCommand: vi.fn(),
      } as unknown as AbstractRunner;
      const packageManager = new TestPackageManager(runner);

      await expect(packageManager.version()).resolves.toBe('1.2.3');
      expect(runMock).toHaveBeenCalledWith('--version', true);
    });
  });

  describe('addProduction', () => {
    it('should resolve to true and stop spinner with succeed on success', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      const result = await packageManager.addProduction(
        ['@nestjs/common', '@nestjs/core'],
        '5.0.0',
      );

      expect(result).toBe(true);
      expect(runMock).toHaveBeenCalledWith(
        'add --save @nestjs/common@5.0.0 @nestjs/core@5.0.0',
        true,
      );
      expect(spinnerMock.succeed).toHaveBeenCalled();
      expect(spinnerMock.fail).not.toHaveBeenCalled();
    });

    it('should resolve to false and call spinner.fail when the runner rejects', async () => {
      const runMock = vi.fn().mockRejectedValue(new Error('add failed'));
      const runner = {
        run: runMock,
        rawFullCommand: vi.fn(),
      } as unknown as AbstractRunner;
      const packageManager = new TestPackageManager(runner);

      const result = await packageManager.addProduction(
        ['@nestjs/common'],
        '5.0.0',
      );

      expect(result).toBe(false);
      expect(spinnerMock.fail).toHaveBeenCalled();
      expect(spinnerMock.succeed).not.toHaveBeenCalled();
    });

    it('should drop saveFlag from the command when cli.saveFlag is empty', async () => {
      class NoSaveFlagPackageManager extends TestPackageManager {
        public override get cli(): PackageManagerCommands {
          return { ...super.cli, saveFlag: '' };
        }
      }
      const { runner, runMock } = createRunner();
      const packageManager = new NoSaveFlagPackageManager(runner);

      await packageManager.addProduction(['@nestjs/common'], '5.0.0');

      expect(runMock).toHaveBeenCalledWith('add @nestjs/common@5.0.0', true);
    });
  });

  describe('addDevelopment', () => {
    it('should run with the dev save flag', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.addDevelopment(['@nestjs/testing'], '5.0.0');

      expect(runMock).toHaveBeenCalledWith(
        'add --save-dev @nestjs/testing@5.0.0',
        true,
      );
    });
  });

  describe('getProduction', () => {
    it('should return ProjectDependency entries from package.json dependencies', async () => {
      const { runner } = createRunner();
      const packageManager = new TestPackageManager(runner);
      (fsPromises.readFile as Mock).mockResolvedValue(
        Buffer.from(
          JSON.stringify({
            dependencies: {
              '@nestjs/common': '11.0.0',
              '@nestjs/core': '11.0.0',
            },
          }),
        ),
      );

      const deps = await packageManager.getProduction();

      expect(fsPromises.readFile).toHaveBeenCalledWith(
        join(process.cwd(), 'package.json'),
      );
      expect(deps).toEqual([
        { name: '@nestjs/common', version: '11.0.0' },
        { name: '@nestjs/core', version: '11.0.0' },
      ]);
    });

    it('should return an empty array when package.json has no dependencies field', async () => {
      const { runner } = createRunner();
      const packageManager = new TestPackageManager(runner);
      (fsPromises.readFile as Mock).mockResolvedValue(
        Buffer.from(JSON.stringify({})),
      );

      await expect(packageManager.getProduction()).resolves.toEqual([]);
    });
  });

  describe('getDevelopment', () => {
    it('should return ProjectDependency entries from devDependencies', async () => {
      const { runner } = createRunner();
      const packageManager = new TestPackageManager(runner);
      (fsPromises.readFile as Mock).mockResolvedValue(
        Buffer.from(
          JSON.stringify({
            devDependencies: {
              typescript: '5.5.0',
            },
          }),
        ),
      );

      const deps = await packageManager.getDevelopment();

      expect(deps).toEqual([{ name: 'typescript', version: '5.5.0' }]);
    });

    it('should return an empty array when devDependencies is absent', async () => {
      const { runner } = createRunner();
      const packageManager = new TestPackageManager(runner);
      (fsPromises.readFile as Mock).mockResolvedValue(
        Buffer.from(JSON.stringify({ dependencies: { foo: '1.0.0' } })),
      );

      await expect(packageManager.getDevelopment()).resolves.toEqual([]);
    });
  });

  describe('updateProduction / updateDevelopment', () => {
    it('should run the update command with all dependencies joined by spaces', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.updateProduction(['a', 'b']);
      expect(runMock).toHaveBeenLastCalledWith('update a b', true);

      await packageManager.updateDevelopment(['c', 'd']);
      expect(runMock).toHaveBeenLastCalledWith('update c d', true);
    });
  });

  describe('upgradeProduction', () => {
    it('should remove dependencies first, then re-add them at the requested tag', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.upgradeProduction(['@nestjs/common'], '5.0.0');

      expect(runMock.mock.calls).toEqual([
        ['remove --save @nestjs/common', true],
        ['add --save @nestjs/common@5.0.0', true],
      ]);
    });
  });

  describe('upgradeDevelopment', () => {
    it('should remove dev dependencies first, then re-add them at the requested tag', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.upgradeDevelopment(['@nestjs/testing'], '5.0.0');

      expect(runMock.mock.calls).toEqual([
        ['remove --save-dev @nestjs/testing', true],
        ['add --save-dev @nestjs/testing@5.0.0', true],
      ]);
    });
  });

  describe('deleteProduction', () => {
    it('should run the remove command with the save flag', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.deleteProduction(['@nestjs/common']);

      expect(runMock).toHaveBeenCalledWith(
        'remove --save @nestjs/common',
        true,
      );
    });

    it('should drop the save flag when it is empty', async () => {
      class NoSaveFlagPackageManager extends TestPackageManager {
        public override get cli(): PackageManagerCommands {
          return { ...super.cli, saveFlag: '' };
        }
      }
      const { runner, runMock } = createRunner();
      const packageManager = new NoSaveFlagPackageManager(runner);

      await packageManager.deleteProduction(['@nestjs/common']);

      expect(runMock).toHaveBeenCalledWith('remove @nestjs/common', true);
    });
  });

  describe('deleteDevelopment', () => {
    it('should run the remove command with the dev save flag', async () => {
      const { runner, runMock } = createRunner();
      const packageManager = new TestPackageManager(runner);

      await packageManager.deleteDevelopment(['@nestjs/testing']);

      expect(runMock).toHaveBeenCalledWith(
        'remove --save-dev @nestjs/testing',
        true,
      );
    });
  });
});
