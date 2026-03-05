import { describe, it, expect, vi, afterAll, Mock } from 'vitest';
import * as fs from 'fs';
import {
  NpmPackageManager,
  PackageManagerFactory,
  PnpmPackageManager,
  YarnPackageManager,
} from '../../../lib/package-managers/index.js';

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
  },
}));

describe('PackageManagerFactory', () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('.prototype.find()', () => {
    it('should return NpmPackageManager when no lock file is found', async () => {
      (fs.promises.readdir as Mock).mockResolvedValue([]);

      const whenPackageManager = PackageManagerFactory.find();
      await expect(whenPackageManager).resolves.toBeInstanceOf(
        NpmPackageManager,
      );
    });

    it('should return YarnPackageManager when "yarn.lock" file is found', async () => {
      (fs.promises.readdir as Mock).mockResolvedValue(['yarn.lock']);

      const whenPackageManager = PackageManagerFactory.find();
      await expect(whenPackageManager).resolves.toBeInstanceOf(
        YarnPackageManager,
      );
    });

    it('should return PnpmPackageManager when "pnpm-lock.yaml" file is found', async () => {
      (fs.promises.readdir as Mock).mockResolvedValue(['pnpm-lock.yaml']);

      const whenPackageManager = PackageManagerFactory.find();
      await expect(whenPackageManager).resolves.toBeInstanceOf(
        PnpmPackageManager,
      );
    });

    describe('when there are all supported lock files', () => {
      it('should prioritize "yarn.lock" file over all the others lock files', async () => {
        (fs.promises.readdir as Mock).mockResolvedValue([
          'pnpm-lock.yaml',
          'package-lock.json',
          // This is intentionally the last element in this array
          'yarn.lock',
        ]);

        const whenPackageManager = PackageManagerFactory.find();
        await expect(whenPackageManager).resolves.toBeInstanceOf(
          YarnPackageManager,
        );
      });
    });
  });
});
