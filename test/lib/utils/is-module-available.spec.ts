import { describe, expect, it } from 'vitest';
import { isModuleAvailable } from '../../../lib/utils/is-module-available.js';

describe('isModuleAvailable', () => {
  it('should return true for a module that can be resolved', () => {
    // typescript is a direct dependency of nest-cli
    expect(isModuleAvailable('typescript')).toBe(true);
  });

  it('should return true for a built-in Node.js module', () => {
    expect(isModuleAvailable('fs')).toBe(true);
  });

  it('should return true for another built-in Node.js module', () => {
    expect(isModuleAvailable('path')).toBe(true);
  });

  it('should return false for a non-existent package', () => {
    expect(
      isModuleAvailable('this-module-really-does-not-exist-abcxyz123'),
    ).toBe(false);
  });

  it('should return false for an invalid relative path', () => {
    expect(isModuleAvailable('../../../does/not/exist.js')).toBe(false);
  });

  it('should return false when resolution throws for an empty string', () => {
    expect(isModuleAvailable('')).toBe(false);
  });
});
