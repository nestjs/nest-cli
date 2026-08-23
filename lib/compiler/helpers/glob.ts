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
 * Characters that make a path segment a pattern rather than a literal, under
 * minimatch's default options (no extglob).
 *
 * Matches the literal chars `*`, `?`, `[`, `{` anywhere, plus `!`, `+`, `@`,
 * `?`, or `*` immediately followed by `(` (an extglob-looking prefix, which
 * minimatch still treats specially even without extglob enabled). Chars like
 * `@`, `(`, `)`, `]`, `}` on their own are NOT magic here: treating them as
 * such previously collapsed the literal base far above the real directory
 * (e.g. an `@` in a username segment), causing `readdir` to walk huge trees
 * and silently return no matches on the first unreadable subdirectory.
 */
const MAGIC_CHARS = /[*?[{]|[!+@?*]\(/;

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

interface WalkedEntry {
  /** Always `/`-separated. */
  parent: string;
  entry: Dirent;
}

/**
 * Walks the directory tree rooted at `dir`, without using `fs`'s own
 * `recursive` option so we can:
 *
 * - Skip an unreadable directory instead of failing the whole walk (`glob`
 *   returns whatever it found before the error, not nothing).
 * - Never follow a symlinked directory into further recursion, matching
 *   `glob`'s `follow: false` default and avoiding symlink cycles. A
 *   symlinked directory's immediate children are still listed (so a pattern
 *   can match one level in), just not walked any deeper.
 */
function walk(dir: string, recursive: boolean): WalkedEntry[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    // Unreadable or missing directory: contribute nothing here, but let
    // sibling directories elsewhere in the walk still report their matches.
    return [];
  }

  const results: WalkedEntry[] = entries.map((entry) => ({ parent: dir, entry }));

  if (!recursive) {
    return results;
  }

  for (const entry of entries) {
    const full = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      results.push(...walk(full, true));
      continue;
    }

    if (entry.isSymbolicLink()) {
      let stats;
      try {
        stats = statSync(full);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        // One level, not recursive: list children but don't descend further.
        results.push(...walk(full, false));
      }
    }
  }

  return results;
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

  // An asset may be configured for a directory that does not exist, or one
  // that turns out to be unreadable; `walk` reports no matches for it (and
  // any nested directories that fail) rather than failing the whole build.
  const walked = walk(base, recursive);

  const matches: GlobEntry[] = [];

  // A trailing `**` matches zero segments, so `base` itself can be a result.
  if (accept(base)) {
    matches.push({ path: base, isFile: false, isDirectory: true });
  }

  for (const { parent, entry } of walked) {
    const full = `${toPosix(parent)}/${entry.name}`;
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
