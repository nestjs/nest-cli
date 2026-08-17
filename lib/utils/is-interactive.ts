/**
 * Whether the process can ask the user a question.
 *
 * Prompts need a TTY on stdin. Under CI, a pipe or `execSync`, asking would
 * block forever with nothing to answer it, so callers fall back to a
 * non-interactive default (or explicit flags) instead of prompting.
 */
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY);
}
