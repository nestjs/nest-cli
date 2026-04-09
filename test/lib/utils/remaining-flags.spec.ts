import { Command } from 'commander';
import { getRemainingFlags } from '../../../lib/utils/remaining-flags';

describe('getRemainingFlags', () => {
  it('should return flags not consumed by commander', () => {
    const program = new Command();
    program.option('-p, --project <project>', 'project name');
    program.parse(['node', 'nest', 'build', '--project', 'app', '--custom']);

    const remaining = getRemainingFlags(program as any);
    expect(remaining).toContain('--custom');
  });

  it('should exclude flags consumed by commander', () => {
    const program = new Command();
    program.option('-w, --watch', 'watch mode');
    program.parse(['node', 'nest', 'build', '--watch', '--extra']);

    const remaining = getRemainingFlags(program as any);
    expect(remaining).not.toContain('--watch');
    expect(remaining).toContain('--extra');
  });

  it('should return all args when no flags start with dashes', () => {
    const program = new Command();
    program.parse(['node', 'nest', 'build']);

    const remaining = getRemainingFlags(program as any);
    // When no --flag is found, splice(0) returns all raw args
    expect(remaining).toEqual(['node', 'nest', 'build']);
  });

  it('should handle multiple unknown flags', () => {
    const program = new Command();
    program.parse(['node', 'nest', 'build', '--foo', '--bar', '--baz']);

    const remaining = getRemainingFlags(program as any);
    expect(remaining).toContain('--foo');
    expect(remaining).toContain('--bar');
    expect(remaining).toContain('--baz');
  });
});
