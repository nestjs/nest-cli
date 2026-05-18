import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTempDir,
  removeTempDir,
  runNest,
  scaffoldApp,
  scaffoldAppWithDeps,
} from './helpers.js';

describe('Info Command (e2e)', () => {
  describe('without installed dependencies', () => {
    let tmpDir: string;
    let appPath: string;

    beforeAll(() => {
      tmpDir = createTempDir('nest-e2e-info-');
      appPath = scaffoldApp(tmpDir, 'info-app');
    });

    afterAll(() => {
      removeTempDir(tmpDir);
    });

    it('should display system information and CLI version', () => {
      const output = runNest('info', appPath);

      expect(output).toMatch(/OS Version/i);
      expect(output).toMatch(/NodeJS Version/i);
      expect(output).toMatch(/Nest CLI/i);
      expect(output).toMatch(/Nest Platform Information/i);
    });
  });

  describe('with installed dependencies', () => {
    let tmpDir: string;
    let appPath: string;

    beforeAll(() => {
      tmpDir = createTempDir('nest-e2e-info-deps-');
      appPath = scaffoldAppWithDeps(tmpDir, 'info-deps-app');
    });

    afterAll(() => {
      removeTempDir(tmpDir);
    });

    it('should display NestJS package versions', () => {
      const output = runNest('info', appPath);

      expect(output).toMatch(/common version/i);
      expect(output).toMatch(/core version/i);
      expect(output).toMatch(/platform-express version/i);
    });
  });
});
