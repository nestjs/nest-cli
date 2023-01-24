import * as fs from 'fs';
import { getDefaultTsconfigPath } from '../../../lib/utils/get-default-tsconfig-path';

jest.mock('fs', () => {
  return {
    existsSync: jest.fn(),
  };
});

describe('getDefaultTsconfigPath', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('should get tsconfig.json when tsconfig.build.json not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const result = getDefaultTsconfigPath();
    expect(result).toBe('tsconfig.json');
  });
  it('should get tsconfig.build.json when tsconfig.build.json exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const result = getDefaultTsconfigPath();
    expect(result).toBe('tsconfig.build.json');
  });
});
