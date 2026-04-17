import { normalize, resolve, sep } from 'path';
import { getEffectiveRootDir } from '../../../../lib/compiler/helpers/get-effective-root-dir';

describe('getEffectiveRootDir', () => {
  const cwd = resolve(sep, 'workspace', 'app');

  it('returns undefined when no rootDir is set and no files are provided', () => {
    expect(getEffectiveRootDir(undefined, undefined, cwd)).toBeUndefined();
    expect(getEffectiveRootDir(undefined, [], cwd)).toBeUndefined();
  });

  it('returns the explicit rootDir resolved against cwd when given a relative path', () => {
    expect(getEffectiveRootDir('src', undefined, cwd)).toBe(
      normalize(resolve(cwd, 'src')),
    );
  });

  it('keeps the explicit rootDir as is when it is already absolute', () => {
    const absoluteRoot = resolve(sep, 'workspace', 'app', 'src');
    expect(getEffectiveRootDir(absoluteRoot, undefined, cwd)).toBe(
      normalize(absoluteRoot),
    );
  });

  it('infers the effective rootDir from the common parent of input files', () => {
    const files = [
      resolve(cwd, 'src', 'main.ts'),
      resolve(cwd, 'src', 'app.module.ts'),
      resolve(cwd, 'src', 'modules', 'foo.ts'),
    ];
    expect(getEffectiveRootDir(undefined, files, cwd)).toBe(
      normalize(resolve(cwd, 'src')),
    );
  });

  it('expands the inferred rootDir up to the project root when test files are included (regression for #3387)', () => {
    // Reproduces `nest build --path tsconfig.json` where tsconfig.json
    // includes test files at the project root level. TypeScript widens the
    // effective rootDir to the project root in that case, so the asset copy
    // logic must follow the same widening to keep assets next to the emit.
    const files = [
      resolve(cwd, 'src', 'main.ts'),
      resolve(cwd, 'src', 'app.module.ts'),
      resolve(cwd, 'test', 'app.e2e-spec.ts'),
    ];
    expect(getEffectiveRootDir(undefined, files, cwd)).toBe(normalize(cwd));
  });

  it('handles a single file by using its directory as the rootDir', () => {
    const files = [resolve(cwd, 'src', 'modules', 'only.ts')];
    expect(getEffectiveRootDir(undefined, files, cwd)).toBe(
      normalize(resolve(cwd, 'src', 'modules')),
    );
  });

  it('prefers the explicit rootDir over the inferred one', () => {
    const files = [
      resolve(cwd, 'src', 'main.ts'),
      resolve(cwd, 'test', 'app.e2e-spec.ts'),
    ];
    expect(getEffectiveRootDir('src', files, cwd)).toBe(
      normalize(resolve(cwd, 'src')),
    );
  });
});
