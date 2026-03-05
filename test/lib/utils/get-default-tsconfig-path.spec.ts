import { describe, it, expect, vi, afterAll } from 'vitest';
import * as fs from 'fs';
import { getDefaultTsconfigPath } from '../../../lib/utils/get-default-tsconfig-path.js';

vi.mock('fs', () => {
  return {
    existsSync: vi.fn(),
  };
});

describe('getDefaultTsconfigPath', () => {
  afterAll(() => {
    vi.clearAllMocks();
  });
  it('should get tsconfig.json when tsconfig.build.json not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const result = getDefaultTsconfigPath();
    expect(result).toBe('tsconfig.json');
  });
  it('should get tsconfig.build.json when tsconfig.build.json exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const result = getDefaultTsconfigPath();
    expect(result).toBe('tsconfig.build.json');
  });
});
