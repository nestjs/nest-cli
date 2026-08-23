import { Dirent, readdirSync, statSync } from 'fs';
import { minimatch } from 'minimatch';

export interface GlobSyncOptions {
  /** A single glob pattern; every path matching it is removed from the result. */
  ignore?: string;
  /** When true, `*` and `**` also match entries whose name starts with a dot. */
  dot?: boolean;
}

export interface GlobEntry {
  /** Absolute path, always `/`-separated regardless of platform. */
  path: string;
  isFile: boolean;
  isDirectory: boolean;
}

/**
 * Characters that make a path segment a pattern rather than a literal.
 *
 * Deliberately over-inclusive: misreading a literal as a pattern only widens
 * the directory we walk (still correct, marginally slower), whereas the
 * reverse would have us stat a path that can never exist.
 */
const MAGIC_CHARS = /[*?[\]{}()!+@]/;

const toPosix = (value: string): string => value.replace(/\\/g, '/');

/**
 * Splits a pattern into the literal prefix we can hand to `readdir` and the
 * trailing segments that still need matching: `/src/a/*.hbs` -> `/src/a`.
 */
function splitPattern(pattern: string): { base: string; rest: string[] } {
  const segments = pattern.split('/');
  const magicIndex = segments.findIndex((segment) => MAGIC_CHARS.test(segment));
  if (magicIndex === -1) {
    return { base: pattern, rest: [] };
  }
  return {
    base: segments.slice(0, magicIndex).join('/') || '/',
    rest: segments.slice(magicIndex),
  };
}

/**
 * `minimatch` does not match `a/**` against `a`, but `glob` does — a trailing
 * globstar matches zero segments. Expanding the suffix restores that for the
 * include pattern, and for `ignore` it reproduces glob's behavior of pruning
 * the ignored directory itself rather than only its contents.
 */
function expandGlobstarSuffix(pattern: string): string[] {
  return pattern.endsWith('/**') ? [pattern, pattern.slice(0, -3)] : [pattern];
}

/**
 * Minimal synchronous glob over `fs` + `minimatch`, replacing the `glob`
 * package. Supports only the surface `assets-manager` needs: one pattern, one
 * optional `ignore` pattern, and `dot`.
 */
export function globEntriesSync(
  pattern: string,
  options: GlobSyncOptions = {},
): GlobEntry[] {
  const { ignore, dot = false } = options;
  const normalized = toPosix(pattern);
  const { base, rest } = splitPattern(normalized);

  const includeMatchers = expandGlobstarSuffix(normalized);
  const ignoreMatchers = ignore ? expandGlobstarSuffix(toPosix(ignore)) : [];

  const accept = (candidate: string): boolean =>
    includeMatchers.some((matcher) => minimatch(candidate, matcher, { dot })) &&
    !ignoreMatchers.some((matcher) => minimatch(candidate, matcher, { dot }));

  // No wildcard anywhere: the pattern names one concrete path.
  if (rest.length === 0) {
    const stats = statSync(normalized, { throwIfNoEntry: false });
    if (!stats || !accept(normalized)) {
      return [];
    }
    return [
      {
        path: normalized,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      },
    ];
  }

  // Only the immediate children of `base` can match a single trailing
  // wildcard segment, so skip the deep walk in that (common) case.
  const recursive =
    rest.length > 1 || rest.some((segment) => segment.includes('**'));

  let entries: Dirent[];
  try {
    entries = readdirSync(base, { recursive, withFileTypes: true });
  } catch {
    // An asset may be configured for a directory that does not exist; `glob`
    // reports no matches rather than failing the build, so we do too.
    return [];
  }

  const matches: GlobEntry[] = [];

  // A trailing `**` matches zero segments, so `base` itself can be a result.
  if (accept(base)) {
    matches.push({ path: base, isFile: false, isDirectory: true });
  }

  for (const entry of entries) {
    // `parentPath` replaced the deprecated `path` in Node 20.12; keep the
    // fallback while `engines.node` still allows 20.11. The double cast is
    // required because @types/node@25 has already dropped `Dirent.path`.
    const parent = toPosix(
      entry.parentPath ?? (entry as unknown as { path: string }).path,
    );
    const full = `${parent}/${entry.name}`;
    if (accept(full)) {
      matches.push({
        path: full,
        isFile: entry.isFile(),
        isDirectory: entry.isDirectory(),
      });
    }
  }

  return matches;
}

/** Drop-in replacement for `glob`'s `sync` export. */
export function globSync(
  pattern: string,
  options: GlobSyncOptions = {},
): string[] {
  return globEntriesSync(pattern, options).map((entry) => entry.path);
}
