import { readFileSync } from 'fs';
import { join } from 'path';

describe('package.json', () => {
  let packageJson: Record<string, any>;

  beforeAll(() => {
    const content = readFileSync(
      join(__dirname, '..', 'package.json'),
      'utf-8',
    );
    packageJson = JSON.parse(content);
  });

  describe('typescript dependency', () => {
    it('should use a tilde range to allow patch-level deduplication', () => {
      const tsVersion = packageJson.dependencies.typescript;
      expect(tsVersion).toBeDefined();
      expect(tsVersion.startsWith('~')).toBe(true);
    });

    it('should not pin typescript to an exact version', () => {
      const tsVersion = packageJson.dependencies.typescript;
      // An exact pin would be just a version number like "5.9.3" with no range prefix
      expect(tsVersion).not.toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
