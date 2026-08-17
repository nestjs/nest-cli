import { describe, expect, it } from 'vitest';
import { normalizeToKebabOrSnakeCase } from '../../../lib/utils/formatting.js';

describe('normalizeToKebabOrSnakeCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(normalizeToKebabOrSnakeCase('myModule')).toBe('my-module');
  });

  it('should convert PascalCase to kebab-case', () => {
    expect(normalizeToKebabOrSnakeCase('MyModule')).toBe('my-module');
  });

  it('should convert multi-word camelCase to kebab-case', () => {
    expect(normalizeToKebabOrSnakeCase('myNewModule')).toBe('my-new-module');
  });

  it('should replace spaces with dashes', () => {
    expect(normalizeToKebabOrSnakeCase('my module')).toBe('my-module');
  });

  it('should replace multiple spaces with dashes', () => {
    expect(normalizeToKebabOrSnakeCase('my new module')).toBe('my-new-module');
  });

  it('should lowercase uppercase strings', () => {
    expect(normalizeToKebabOrSnakeCase('MYMODULE')).toBe('mymodule');
  });

  it('should preserve underscores', () => {
    expect(normalizeToKebabOrSnakeCase('my_module')).toBe('my_module');
  });

  it('should handle already kebab-case strings', () => {
    expect(normalizeToKebabOrSnakeCase('my-module')).toBe('my-module');
  });

  it('should handle single word strings', () => {
    expect(normalizeToKebabOrSnakeCase('module')).toBe('module');
  });

  it('should handle empty string', () => {
    expect(normalizeToKebabOrSnakeCase('')).toBe('');
  });

  it('should handle camelCase with numbers', () => {
    expect(normalizeToKebabOrSnakeCase('module1Name')).toBe('module1-name');
  });

  it('should handle mixed spaces and camelCase', () => {
    expect(normalizeToKebabOrSnakeCase('myModule name')).toBe('my-module-name');
  });

  it('should handle consecutive uppercase letters', () => {
    // The regex only splits on lowercase-to-uppercase boundaries,
    // so consecutive uppercase letters are not individually separated
    expect(normalizeToKebabOrSnakeCase('myHTTPServer')).toBe('my-httpserver');
  });

  it('should handle strings with tabs by replacing them with dashes', () => {
    expect(normalizeToKebabOrSnakeCase('my\tmodule')).toBe('my-module');
  });
});
