import { beforeEach, describe, expect, it, vi } from 'vitest';

const run = vi.fn().mockResolvedValue(null);
const addDevelopment = vi.fn().mockResolvedValue(undefined);

vi.mock('@inquirer/prompts', () => ({ confirm: vi.fn() }));

vi.mock('../../lib/utils/mau.js', async () => {
  const original = await vi.importActual('../../lib/utils/mau.js');
  return { ...original, findMauBinary: vi.fn() };
});

vi.mock('../../lib/utils/is-interactive.js', () => ({
  isInteractive: vi.fn(() => true),
}));

vi.mock('../../lib/runners/mau.runner.js', () => ({
  MauRunner: vi.fn().mockImplementation(function () {
    return { run };
  }),
}));

vi.mock('../../lib/package-managers/index.js', () => ({
  PackageManagerFactory: { find: vi.fn(async () => ({ addDevelopment })) },
}));

import { confirm } from '@inquirer/prompts';
import { DeployAction } from '../../actions/deploy.action.js';
import { MauRunner } from '../../lib/runners/mau.runner.js';
import { PackageManagerFactory } from '../../lib/package-managers/index.js';
import { isInteractive } from '../../lib/utils/is-interactive.js';
import { findMauBinary } from '../../lib/utils/mau.js';

const MAU_BINARY = '/project/node_modules/@nestjs/mau/bin/mau.js';

describe('DeployAction', () => {
  let action: DeployAction;

  beforeEach(() => {
    vi.clearAllMocks();
    run.mockResolvedValue(null);
    addDevelopment.mockResolvedValue(undefined);
    vi.mocked(isInteractive).mockReturnValue(true);
    vi.mocked(findMauBinary).mockReturnValue(MAU_BINARY);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    action = new DeployAction();
  });

  describe('when @nestjs/mau is installed', () => {
    it('runs "mau deploy" through the resolved binary', async () => {
      await action.handle({ args: [] });

      expect(MauRunner).toHaveBeenCalledWith(MAU_BINARY);
      expect(run).toHaveBeenCalledWith('deploy');
    });

    it('forwards the command arguments to mau', async () => {
      await action.handle({ args: ['--force', '--env=production'] });

      expect(run).toHaveBeenCalledWith('deploy --force --env=production');
    });

    it('never prompts for installation', async () => {
      await action.handle({ args: [] });

      expect(confirm).not.toHaveBeenCalled();
      expect(PackageManagerFactory.find).not.toHaveBeenCalled();
    });

    it('propagates a failing deploy so the command exits non-zero', async () => {
      run.mockRejectedValue(undefined);

      await expect(action.handle({ args: [] })).rejects.toBeUndefined();
    });
  });

  describe('when @nestjs/mau is missing', () => {
    beforeEach(() => {
      // Missing on the first lookup, present again after installation.
      vi.mocked(findMauBinary)
        .mockReturnValueOnce(undefined)
        .mockReturnValue(MAU_BINARY);
    });

    it('installs it as a dev dependency once the user agrees, then deploys', async () => {
      vi.mocked(confirm).mockResolvedValue(true as never);

      await action.handle({ args: [] });

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(addDevelopment).toHaveBeenCalledWith(['@nestjs/mau'], 'latest');
      expect(MauRunner).toHaveBeenCalledWith(MAU_BINARY);
      expect(run).toHaveBeenCalledWith('deploy');
    });

    it('aborts without deploying when the user declines', async () => {
      vi.mocked(confirm).mockResolvedValue(false as never);

      await expect(action.handle({ args: [] })).rejects.toThrow(/@nestjs\/mau/);
      expect(addDevelopment).not.toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
    });

    it('tells the user how to install it instead of prompting without a TTY', async () => {
      vi.mocked(isInteractive).mockReturnValue(false);

      await expect(action.handle({ args: [] })).rejects.toThrow(/@nestjs\/mau/);
      expect(confirm).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('npm install --save-dev @nestjs/mau'),
      );
      expect(run).not.toHaveBeenCalled();
    });

    it('reports a failed installation rather than trying to deploy', async () => {
      vi.mocked(confirm).mockResolvedValue(true as never);
      addDevelopment.mockRejectedValue(new Error('registry unreachable'));

      await expect(action.handle({ args: [] })).rejects.toThrow(/@nestjs\/mau/);
      expect(run).not.toHaveBeenCalled();
    });

    it('fails clearly when the binary is still unresolvable after installing', async () => {
      vi.mocked(confirm).mockResolvedValue(true as never);
      vi.mocked(findMauBinary).mockReturnValue(undefined);

      await expect(action.handle({ args: [] })).rejects.toThrow(/@nestjs\/mau/);
      expect(run).not.toHaveBeenCalled();
    });
  });
});
