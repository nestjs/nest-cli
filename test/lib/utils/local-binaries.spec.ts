import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadLocalBinCommandLoader,
  localBinExists,
} from '../../../lib/utils/local-binaries.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('local-binaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localBinExists', () => {
    it('should return true when existsSync returns true', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      expect(localBinExists()).toBe(true);
    });

    it('should return false when existsSync returns false', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      expect(localBinExists()).toBe(false);
    });

    it('should check a path ending with node_modules/@nestjs/cli', () => {
      const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      localBinExists();

      expect(existsSpy).toHaveBeenCalledTimes(1);
      const calledWith = existsSpy.mock.calls[0][0] as string;
      const expectedSuffix = ['node_modules', '@nestjs', 'cli'].join(path.sep);
      expect(calledWith.endsWith(expectedSuffix)).toBe(true);
    });

    it('should check a path that starts with the current working directory', () => {
      const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      localBinExists();

      const calledWith = existsSpy.mock.calls[0][0] as string;
      expect(calledWith.startsWith(process.cwd())).toBe(true);
    });
  });

  describe('loadLocalBinCommandLoader', () => {
    it('should be an async function returning a Promise', () => {
      expect(loadLocalBinCommandLoader).toBeInstanceOf(Function);
      const result = loadLocalBinCommandLoader();
      expect(result).toBeInstanceOf(Promise);
      // Swallow the rejection to avoid unhandled rejection warnings.
      result.catch(() => undefined);
    });

    it('should reject when the local @nestjs/cli commands module cannot be resolved', async () => {
      await expect(loadLocalBinCommandLoader()).rejects.toBeDefined();
    });
  });
});
