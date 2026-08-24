/**
 * A minimal synchronous glob over `fs` + `minimatch`, covering just the
 * surface `assets-manager` needs: one pattern, one optional `ignore`
 * pattern, and `dot`.
 *
 * This replaced the `glob` package (see nestjs/nest-cli#3520), and asset
 * copying is expected to behave exactly as it did before that swap. Several
 * rules below therefore look arbitrary in isolation — zero-segment trailing
 * globstars, the symlink depth budget — but each one preserves a documented
 * behavior that build configurations already depend on. The tests in
 * `test/lib/compiler/helpers/glob.spec.ts` pin them.
 */
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
 * A trailing globstar matches zero segments, so `a/**` must match `a`
 * itself; `minimatch` alone does not. Expanding the suffix restores that for
 * the include pattern, and for `ignore` it prunes the ignored directory
 * itself rather than only its contents.
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
 * How far below a symlinked directory a pattern can still reach.
 *
 * A globstar never recurses *through* a symlinked directory, but the
 * explicit segments that follow the last one keep matching normally once
 * there. So a pattern ending in a bare globstar stops at the symlink itself
 * and gets a budget of 0; adding one more segment after it reaches a single
 * level inside (budget 1), and two segments reach two levels (budget 2). A
 * pattern with no globstar at all does no recursion of this kind, so its own
 * depth is the only bound.
 *
 * Returning a finite number also bounds the walk: symlink cycles terminate
 * because each crossing costs depth we can never regain.
 */
function symlinkDepthBudget(rest: string[]): number {
  for (let index = rest.length - 1; index >= 0; index--) {
    if (rest[index].includes('**')) {
      return rest.length - index - 1;
    }
  }
  return rest.length;
}

/**
 * Walks the directory tree rooted at `dir`, without using `fs`'s own
 * `recursive` option so we can:
 *
 * - Skip an unreadable directory instead of failing the whole walk: one
 *   `EACCES` deep in an asset tree must not silently empty the result.
 * - Stop descending once we are `budget` levels past a symlinked directory
 *   (see `symlinkDepthBudget`), which also makes symlink cycles terminate.
 *
 * `depth` is how many levels below the nearest symlinked ancestor an entry
 * sits; 0 means it was reached without crossing one.
 */
function walk(
  dir: string,
  recursive: boolean,
  budget: number,
  depth = 0,
): WalkedEntry[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    // Unreadable or missing directory: contribute nothing here, but let
    // sibling directories elsewhere in the walk still report their matches.
    return [];
  }

  const results: WalkedEntry[] = entries.map((entry) => ({
    parent: dir,
    entry,
  }));

  if (!recursive) {
    return results;
  }

  for (const entry of entries) {
    const full = `${dir}/${entry.name}`;

    // Below a symlink every further level costs budget; above one, plain
    // directory recursion is unbounded.
    if (entry.isDirectory()) {
      const childDepth = depth === 0 ? 0 : depth + 1;
      if (childDepth <= budget) {
        results.push(...walk(full, true, budget, childDepth));
      }
      continue;
    }

    // `Dirent.isDirectory()` is false for a symlink (it reports on the link
    // itself), so a symlinked directory only ever reaches this branch.
    if (entry.isSymbolicLink() && depth + 1 <= budget) {
      let stats;
      try {
        stats = statSync(full);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        results.push(...walk(full, true, budget, depth + 1));
      }
    }
  }

  return results;
}

/**
 * Expands `pattern` to every matching path, with the type of each entry.
 * See the file header for the compatibility rules this preserves.
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
  const walked = walk(base, recursive, symlinkDepthBudget(rest));

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

/** Expands `pattern` to every matching path. */
export function globSync(
  pattern: string,
  options: GlobSyncOptions = {},
): string[] {
  return globEntriesSync(pattern, options).map((entry) => entry.path);
}
