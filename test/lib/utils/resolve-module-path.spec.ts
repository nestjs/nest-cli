import { describe, expect, it } from 'vitest';
import { resolveModulePath } from '../../../lib/utils/resolve-module-path.js';

describe('resolveModulePath', () => {
  it('should return the resolved filename for an installed package', () => {
    const resolved = resolveModulePath('typescript');

    expect(resolved).toBeDefined();
    expect(resolved).toContain('typescript');
  });

  it('should resolve built-in modules', () => {
    expect(resolveModulePath('fs')).toBe('fs');
    expect(resolveModulePath('path')).toBe('path');
  });

  it('should return undefined for a module that does not exist', () => {
    expect(
      resolveModulePath('this-module-really-does-not-exist-abcxyz123'),
    ).toBeUndefined();
  });

  it('should return undefined for a relative path that does not exist', () => {
    expect(resolveModulePath('../../../does/not/exist.js')).toBeUndefined();
  });

  it('should return undefined for an empty path', () => {
    expect(resolveModulePath('')).toBeUndefined();
  });
});
