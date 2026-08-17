import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { getRemainingFlags } from '../../../lib/utils/remaining-flags.js';

function createCommand(
  rawArgs: string[],
  options: { short?: string; long?: string }[] = [],
  optionValues: Record<string, string> = {},
): Command {
  const cmd = {
    rawArgs: [...rawArgs],
    options: options.map((o) => ({
      short: o.short,
      long: o.long,
    })),
    getOptionValue: (key: string) => optionValues[key],
  } as unknown as Command;
  return cmd;
}

describe('getRemainingFlags', () => {
  it('should return flags not consumed by commander', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--watch', '--custom-flag'],
      [{ long: '--watch' }],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toContain('--custom-flag');
    expect(result).not.toContain('--watch');
  });

  it('should return empty array when all flags are consumed by commander', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--watch'],
      [{ long: '--watch' }],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toEqual([]);
  });

  it('should return all raw args when no flags starting with "--" are present', () => {
    // When no "--" flags exist, findIndex returns -1, Math.max(-1, 0) = 0,
    // so splice(0) returns all elements from the rawArgs array
    const cmd = createCommand(['node', 'nest', 'start'], []);

    const result = getRemainingFlags(cmd);

    expect(result).toEqual(['node', 'nest', 'start']);
  });

  it('should filter out short option flags consumed by commander', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '-w', '--custom'],
      [{ short: '-w' }],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toContain('--custom');
    expect(result).not.toContain('-w');
  });

  it('should filter out option arguments when they match commander option values', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--config', 'tsconfig.app.json', '--custom'],
      [{ long: '--config' }],
      { config: 'tsconfig.app.json' },
    );

    const result = getRemainingFlags(cmd);

    expect(result).not.toContain('--config');
    expect(result).not.toContain('tsconfig.app.json');
    expect(result).toContain('--custom');
  });

  it('should handle multiple remaining flags', () => {
    const cmd = createCommand(
      ['node', 'nest', 'start', '--flag1', '--flag2', '--flag3'],
      [],
    );

    const result = getRemainingFlags(cmd);

    expect(result).toContain('--flag1');
    expect(result).toContain('--flag2');
    expect(result).toContain('--flag3');
  });

  it('should return empty array when rawArgs is empty', () => {
    const cmd = createCommand([], []);

    const result = getRemainingFlags(cmd);

    expect(result).toEqual([]);
  });
});
