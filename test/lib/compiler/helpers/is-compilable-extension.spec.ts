import { isCompilableExtension } from '../../../../lib/compiler/helpers/is-compilable-extension';

describe('isCompilableExtension', () => {
  it('should return true when extension is an allowed extension', () => {
    expect(isCompilableExtension('foo.ts', ['.ts'])).toBe(true);
  });
  it('should return false when extension is not an allowed extension', () => {
    expect(isCompilableExtension('foo.js', ['.ts'])).toBe(false);
  });
});
