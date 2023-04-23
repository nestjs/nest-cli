import * as fs from 'fs';
import {
  NpmPackageManager,
  PackageManagerFactory,
  PnpmPackageManager,
  YarnPackageManager,
} from '../../../lib/package-managers';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
  },
}));

describe('PackageManagerFactory', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('.prototype.find()', () => {
    it('should return NpmPackageManager when no lock file is found', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue([]);

      const whenPackageManager = PackageManagerFactory.find();
      await expect(whenPackageManager).resolves.toBeInstanceOf(
        NpmPackageManager,
      );
    });

    it('should return YarnPackageManager when "yarn.lock" file is found', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['yarn.lock']);

      const whenPackageManager = PackageManagerFactory.find();
      await expect(whenPackageManager).resolves.toBeInstanceOf(
        YarnPackageManager,
      );
    });

    it('should return PnpmPackageManager when "pnpm-lock.yaml" file is found', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['pnpm-lock.yaml']);

      const whenPackageManager = PackageManagerFactory.find();
      await expect(whenPackageManager).resolves.toBeInstanceOf(
        PnpmPackageManager,
      );
    });

    describe('when there are all supported lock files', () => {
      it('should prioritize "yarn.lock" file over all the others lock files', async () => {
        (fs.promises.readdir as jest.Mock).mockResolvedValue([
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
