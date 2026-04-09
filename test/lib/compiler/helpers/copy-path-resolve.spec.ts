import * as path from 'path';
import { copyPathResolve } from '../../../../lib/compiler/helpers/copy-path-resolve';

describe('copyPathResolve', () => {
  it('should join outDir with the full file path when up is 0', () => {
    const result = copyPathResolve('src/assets/file.txt', 'dist', 0);
    expect(result).toBe(path.join('dist', 'src/assets/file.txt'));
  });

  it('should strip leading path segments based on up value', () => {
    const result = copyPathResolve('src/assets/file.txt', 'dist', 1);
    expect(result).toBe(path.join('dist', 'assets', 'file.txt'));
  });

  it('should strip multiple path segments when up is greater than 1', () => {
    const result = copyPathResolve('src/assets/images/logo.png', 'dist', 2);
    expect(result).toBe(path.join('dist', 'images', 'logo.png'));
  });

  it('should throw when path depth is less than up - 1', () => {
    expect(() => copyPathResolve('file.txt', 'dist', 3)).toThrow(
      'Path outside of project folder is not allowed',
    );
  });

  it('should resolve to outDir when all segments are stripped', () => {
    // depth('a/b') = 1, up = 2 strips both segments
    const result = copyPathResolve('a/b', 'out', 2);
    expect(result).toBe('out');
  });
});
