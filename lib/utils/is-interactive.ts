let promptsDisabled = false;

/**
 * Turns every prompt off for the rest of the process, as `--no-interactive`
 * does for terminals that look interactive but have nobody to answer, like a
 * coding agent's pseudo-terminal.
 */
export function disablePrompts(disabled = true): void {
  promptsDisabled = disabled;
}

/**
 * Whether the process can ask the user a question.
 *
 * Prompts need a TTY on stdin to read the answer and on stdout to show the
 * question. Under CI, a pipe or `execSync`, asking would block forever with
 * nothing to answer it, so callers fall back to a non-interactive default (or
 * explicit flags) instead of prompting.
 */
export function isInteractive(): boolean {
  return (
    !promptsDisabled &&
    Boolean(process.stdin.isTTY) &&
    Boolean(process.stdout.isTTY) &&
    !isCI()
  );
}

function isCI(): boolean {
  const ci = process.env.CI;
  return ci !== undefined && ci !== '' && ci !== '0' && ci !== 'false';
}
