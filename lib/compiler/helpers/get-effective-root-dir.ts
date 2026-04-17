import { dirname, isAbsolute, normalize, resolve, sep } from 'path';

/**
 * Computes the effective TypeScript rootDir for an emit, mirroring how the
 * TypeScript compiler determines it when `rootDir` is not set in tsconfig.
 *
 * When `rootDir` is explicitly configured, its absolute, normalized form is
 * returned. Otherwise the longest common parent directory of the input file
 * list is used (the same heuristic TypeScript applies through
 * `Program#getCommonSourceDirectory`).
 *
 * Returns `undefined` if no rootDir can be determined (e.g. no input files).
 *
 * @param explicitRootDir Value of `compilerOptions.rootDir` from tsconfig, if any.
 * @param fileNames List of TypeScript input files (absolute paths).
 * @param cwd Current working directory used to resolve relative paths.
 */
export function getEffectiveRootDir(
  explicitRootDir: string | undefined,
  fileNames: readonly string[] | undefined,
  cwd: string = process.cwd(),
): string | undefined {
  if (explicitRootDir) {
    return normalize(
      isAbsolute(explicitRootDir) ? explicitRootDir : resolve(cwd, explicitRootDir),
    );
  }

  if (!fileNames || fileNames.length === 0) {
    return undefined;
  }

  const absolutePaths = fileNames.map((file) =>
    normalize(isAbsolute(file) ? file : resolve(cwd, file)),
  );

  let commonDir = dirname(absolutePaths[0]);
  for (let i = 1; i < absolutePaths.length; i++) {
    commonDir = commonParentDir(commonDir, dirname(absolutePaths[i]));
    if (!commonDir) {
      return undefined;
    }
  }
  return commonDir;
}

function commonParentDir(a: string, b: string): string {
  const aSegments = a.split(sep);
  const bSegments = b.split(sep);
  const length = Math.min(aSegments.length, bSegments.length);

  let i = 0;
  while (i < length && aSegments[i] === bSegments[i]) {
    i++;
  }
  return aSegments.slice(0, i).join(sep);
}
