import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  disablePrompts,
  isInteractive,
} from '../../../lib/utils/is-interactive.js';

describe('isInteractive', () => {
  const stdinTTY = process.stdin.isTTY;
  const stdoutTTY = process.stdout.isTTY;

  const setTTY = (stdin: boolean, stdout: boolean) => {
    process.stdin.isTTY = stdin;
    process.stdout.isTTY = stdout;
  };

  beforeEach(() => {
    setTTY(true, true);
    vi.stubEnv('CI', '');
  });

  afterEach(() => {
    process.stdin.isTTY = stdinTTY;
    process.stdout.isTTY = stdoutTTY;
    vi.unstubAllEnvs();
    disablePrompts(false);
  });

  it('is true with a terminal on both ends', () => {
    expect(isInteractive()).toBe(true);
  });

  it('is false when stdin is not a terminal (piped input, a closed stdin)', () => {
    setTTY(false, true);

    expect(isInteractive()).toBe(false);
  });

  it('is false when stdout is not a terminal, where nobody sees the question', () => {
    setTTY(true, false);

    expect(isInteractive()).toBe(false);
  });

  it.each(['true', '1', 'yes'])('is false under CI=%s', (value) => {
    vi.stubEnv('CI', value);

    expect(isInteractive()).toBe(false);
  });

  it.each(['false', '0', ''])('ignores CI=%s', (value) => {
    vi.stubEnv('CI', value);

    expect(isInteractive()).toBe(true);
  });

  it('is false once prompts are disabled, as --no-interactive does', () => {
    disablePrompts();

    expect(isInteractive()).toBe(false);
  });
});
