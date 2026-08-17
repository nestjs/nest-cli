import { describe, expect, it } from 'vitest';
import { assertNonArray } from '../../../lib/utils/type-assertions.js';

describe('assertNonArray', () => {
  it('should not throw for a string value', () => {
    expect(() => assertNonArray('hello')).not.toThrow();
  });

  it('should not throw for a number value', () => {
    expect(() => assertNonArray(42)).not.toThrow();
  });

  it('should not throw for a boolean value', () => {
    expect(() => assertNonArray(true)).not.toThrow();
  });

  it('should not throw for an object value', () => {
    expect(() => assertNonArray({ key: 'value' })).not.toThrow();
  });

  it('should not throw for null', () => {
    expect(() => assertNonArray(null)).not.toThrow();
  });

  it('should not throw for undefined', () => {
    expect(() => assertNonArray(undefined)).not.toThrow();
  });

  it('should not throw for a function', () => {
    expect(() => assertNonArray(() => {})).not.toThrow();
  });

  it('should throw TypeError for an empty array', () => {
    expect(() => assertNonArray([])).toThrow(TypeError);
    expect(() => assertNonArray([])).toThrow('Expected a non-array value');
  });

  it('should throw TypeError for an array with elements', () => {
    expect(() => assertNonArray([1, 2, 3])).toThrow(TypeError);
    expect(() => assertNonArray([1, 2, 3])).toThrow(
      'Expected a non-array value',
    );
  });

  it('should throw TypeError for a nested array', () => {
    expect(() => assertNonArray([[1], [2]])).toThrow(TypeError);
  });

  it('should throw TypeError for an array of objects', () => {
    expect(() => assertNonArray([{ a: 1 }])).toThrow(TypeError);
  });
});
