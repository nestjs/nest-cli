import { describe, expect, it } from 'vitest';
import { AddAction } from '../../actions/add.action.js';

// Expose private methods for targeted testing
type AddActionInternal = AddAction & {
  getPackageName(library: string): string;
  getCollectionName(library: string, packageName: string): string;
  getTagName(packageName: string): string;
};

describe('AddAction helpers', () => {
  const action = new AddAction() as AddActionInternal;

  describe('getPackageName', () => {
    it('should return the package name for a non-scoped package', () => {
      expect(action.getPackageName('my-lib')).toBe('my-lib');
    });

    it('should return the package name with version for a non-scoped package', () => {
      expect(action.getPackageName('my-lib@1.0.0')).toBe('my-lib@1.0.0');
    });

    it('should return scope/name for a scoped package', () => {
      expect(action.getPackageName('@scope/pkg')).toBe('@scope/pkg');
    });

    it('should return scope/name@version for a scoped package with version', () => {
      expect(action.getPackageName('@scope/pkg@1.0.0')).toBe(
        '@scope/pkg@1.0.0',
      );
    });

    it('should strip subpaths from a non-scoped package', () => {
      expect(action.getPackageName('my-lib/subpath')).toBe('my-lib');
    });
  });

  describe('getTagName', () => {
    it('should return empty string for a non-scoped package with no version', () => {
      expect(action.getTagName('my-lib')).toBe('');
    });

    it('should return the version for a non-scoped package with version', () => {
      expect(action.getTagName('my-lib@1.0.0')).toBe('1.0.0');
    });

    it('should return empty string for a scoped package with no version', () => {
      expect(action.getTagName('@scope/pkg')).toBe('');
    });

    it('should return the version for a scoped package with version', () => {
      expect(action.getTagName('@scope/pkg@1.0.0')).toBe('1.0.0');
    });

    it('should return "latest" tag when specified', () => {
      expect(action.getTagName('my-lib@latest')).toBe('latest');
    });

    it('should return "next" tag when specified', () => {
      expect(action.getTagName('@scope/pkg@next')).toBe('next');
    });

    it('should always return a string (not undefined)', () => {
      const result = action.getTagName('@scope/pkg');
      expect(typeof result).toBe('string');
    });
  });

  describe('getCollectionName', () => {
    it('should return the package name when no version is included', () => {
      expect(action.getCollectionName('my-lib', 'my-lib')).toBe('my-lib');
    });

    it('should strip the version for a non-scoped package', () => {
      expect(action.getCollectionName('my-lib@1.0.0', 'my-lib@1.0.0')).toBe(
        'my-lib',
      );
    });

    it('should return the scope/name for a scoped package', () => {
      expect(action.getCollectionName('@scope/pkg', '@scope/pkg')).toBe(
        '@scope/pkg',
      );
    });
  });
});
