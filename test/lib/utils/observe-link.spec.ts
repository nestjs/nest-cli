import * as fs from 'fs';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '../../../lib/ui/index.js';
import {
  hasObserveDependency,
  printObservabilityNextSteps,
} from '../../../lib/utils/observe-link.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('hasObserveDependency', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when @nestjs/observe is in dependencies', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ dependencies: { '@nestjs/observe': '^0.3.0' } }),
    );

    expect(hasObserveDependency('/some/path')).toBe(true);
  });

  it('should return true when @nestjs/observe is in devDependencies', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ devDependencies: { '@nestjs/observe': '^0.3.0' } }),
    );

    expect(hasObserveDependency('/some/path')).toBe(true);
  });

  it('should return false when @nestjs/observe is not listed', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ dependencies: { '@nestjs/core': '^12.0.0' } }),
    );

    expect(hasObserveDependency('/some/path')).toBe(false);
  });

  it('should return false when package.json cannot be read', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(hasObserveDependency('/nonexistent/path')).toBe(false);
  });

  it('should read package.json from the given directory', () => {
    const readFileSync = vi
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify({}));

    hasObserveDependency('/some/path');

    expect(readFileSync).toHaveBeenCalledWith(
      join('/some/path', 'package.json'),
      'utf8',
    );
  });
});

describe('printObservabilityNextSteps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should print the link command and the default by-hand hint', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    printObservabilityNextSteps();

    const output = info.mock.calls.flat().join('\n');
    expect(output).toContain(MESSAGES.OBSERVABILITY_LINK_COMMAND);
    expect(output).toContain(MESSAGES.OBSERVABILITY_KEYS_HINT);
  });

  it('should print the given by-hand hint instead of the default', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    printObservabilityNextSteps(MESSAGES.OBSERVABILITY_UPGRADE_KEYS_HINT);

    const output = info.mock.calls.flat().join('\n');
    expect(output).toContain(MESSAGES.OBSERVABILITY_UPGRADE_KEYS_HINT);
    expect(output).not.toContain(MESSAGES.OBSERVABILITY_KEYS_HINT);
  });
});
