import { realpathSync } from 'fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'path';
import { Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';

/**
 * Whether paths are allowed to point outside of the project directory.
 *
 * Confinement is on by default: `compilerOptions.allowOutsidePaths` has to be
 * set to `true` explicitly to build to (or delete) locations outside of the
 * project, which some monorepo layouts legitimately rely on. See
 * nestjs/nest-cli#3463.
 */
export function areOutsidePathsAllowed(
  configuration: Required<Configuration>,
  appName: string | undefined,
): boolean {
  return (
    getValueOrDefault<boolean>(
      configuration,
      'compilerOptions.allowOutsidePaths',
      appName,
    ) ?? false
  );
}

export interface PathConfinementOptions {
  /**
   * Resolve symlinks before comparing. Required whenever the path is going to be
   * *written through*: a lexical check alone accepts a path such as "dist" that
   * is itself a symlink pointing outside of the project, and the write would
   * land outside.
   *
   * Deletion does not need it — `fs.rm` unlinks a symlink instead of following
   * it — and turning it on there would reject ordinary setups that legitimately
   * symlink a directory inside the project (a workspace "node_modules", for
   * instance), which is the regression that got the first attempt at this
   * reverted. See nestjs/nest-cli#3460.
   */
  resolveSymlinks?: boolean;
  projectRoot?: string;
}

/**
 * Resolves `targetPath` against the project directory and asserts that it stays
 * within it. Returns the resolved absolute path.
 *
 * @throws when the path resolves to the project directory itself or escapes it
 */
export function assertPathInsideProject(
  targetPath: string,
  propertyName: string,
  {
    resolveSymlinks = false,
    projectRoot = process.cwd(),
  }: PathConfinementOptions = {},
): string {
  const resolvedPath = resolve(projectRoot, targetPath);
  const comparableRoot = resolveSymlinks
    ? realpathOrClosestExisting(projectRoot)
    : resolve(projectRoot);
  const comparablePath = resolveSymlinks
    ? realpathOrClosestExisting(resolvedPath)
    : resolvedPath;
  const relativePath = relative(comparableRoot, comparablePath);

  const isProjectRoot = relativePath === '';
  const isOutsideProject =
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath);

  if (isProjectRoot || isOutsideProject) {
    throw new Error(
      `Refusing to use "${propertyName}" path outside of or equal to the project directory: ${targetPath}. ` +
        `Set "compilerOptions.allowOutsidePaths" to true if this is intentional.`,
    );
  }
  return resolvedPath;
}

/**
 * Resolves symlinks in `targetPath`. Output paths routinely do not exist yet, so
 * the closest existing ancestor is resolved instead and the remaining segments
 * are appended back — enough to catch a symlinked ancestor while still working
 * for a directory that is about to be created.
 */
function realpathOrClosestExisting(targetPath: string): string {
  let current = resolve(targetPath);
  const trailingSegments: string[] = [];

  for (;;) {
    try {
      return resolve(realpathSync(current), ...trailingSegments);
    } catch {
      const parent = dirname(current);
      if (parent === current) {
        // Reached the root without finding an existing path; nothing to resolve.
        return resolve(targetPath);
      }
      trailingSegments.unshift(basename(current));
      current = parent;
    }
  }
}
