import * as fs from 'fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isEsmProject } from '../../../lib/utils/is-esm-project.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('isEsmProject', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when package.json has "type": "module"', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ type: 'module' }),
    );

    expect(isEsmProject('/some/path')).toBe(true);
  });

  it('should return false when package.json has "type": "commonjs"', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ type: 'commonjs' }),
    );

    expect(isEsmProject('/some/path')).toBe(false);
  });

  it('should return false when package.json has no "type" field', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ name: 'my-project' }),
    );

    expect(isEsmProject('/some/path')).toBe(false);
  });

  it('should return false when package.json does not exist', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(isEsmProject('/nonexistent/path')).toBe(false);
  });

  it('should return false when package.json contains invalid JSON', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue('not valid json');

    expect(isEsmProject('/some/path')).toBe(false);
  });

  it('should return false when "type" is an empty string', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ type: '' }));

    expect(isEsmProject('/some/path')).toBe(false);
  });

  it('should return false when "type" is null', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ type: null }),
    );

    expect(isEsmProject('/some/path')).toBe(false);
  });

  it('should read package.json from the provided directory', () => {
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify({ type: 'module' }));

    isEsmProject('/custom/dir');

    expect(readSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      'utf-8',
    );
  });
});
