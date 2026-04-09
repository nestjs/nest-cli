import { describe, expect, it } from 'vitest';
import { appendTsExtension } from '../../../../lib/compiler/helpers/append-extension.js';

describe('appendTsExtension', () => {
  it('should append .ts when path has no extension', () => {
    expect(appendTsExtension('src/main')).toBe('src/main.ts');
  });

  it('should not append .ts when path already ends with .ts', () => {
    expect(appendTsExtension('src/main.ts')).toBe('src/main.ts');
  });

  it('should append .ts when path has a different extension', () => {
    expect(appendTsExtension('src/main.js')).toBe('src/main.js.ts');
  });

  it('should handle paths with directories', () => {
    expect(appendTsExtension('apps/my-app/src/main')).toBe(
      'apps/my-app/src/main.ts',
    );
  });

  it('should handle paths with dots in directory names', () => {
    expect(appendTsExtension('src/v2.0/main')).toBe('src/v2.0/main.ts');
  });

  it('should handle empty string', () => {
    expect(appendTsExtension('')).toBe('.ts');
  });
});
