import { spawn } from 'child_process';
import { platform } from 'os';
import { AbstractRunner } from '../../../lib/runners/abstract.runner';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('os', () => ({
  platform: jest.fn(),
}));

describe('AbstractRunner Security Tests', () => {
  let mockSpawn: jest.MockedFunction<typeof spawn>;
  let mockPlatform: jest.MockedFunction<typeof platform>;

  beforeEach(() => {
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    mockPlatform = platform as jest.MockedFunction<typeof platform>;

    const mockChild = {
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 0);
        }
      }),
    } as any;

    mockSpawn.mockReturnValue(mockChild);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Shell injection protection', () => {
    it('should not use shell on macOS/Linux to prevent command injection', async () => {
      mockPlatform.mockReturnValue('darwin');

      const runner = new AbstractRunner('node');
      await runner.run('$(malicious-command)');

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['$(malicious-command)'],
        expect.objectContaining({
          shell: false,
        }),
      );
    });

    it('should not use shell on Linux to prevent variable expansion', async () => {
      mockPlatform.mockReturnValue('linux');

      const runner = new AbstractRunner('node');
      await runner.run('$USER');

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['$USER'],
        expect.objectContaining({
          shell: false,
        }),
      );
    });

    it('should use shell only on Windows for compatibility', async () => {
      mockPlatform.mockReturnValue('win32');

      const runner = new AbstractRunner('node');
      await runner.run('test-command');

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['test-command'],
        expect.objectContaining({
          shell: true,
        }),
      );
    });

    it('should pass commands as separate arguments, not concatenated strings', async () => {
      mockPlatform.mockReturnValue('darwin');

      const runner = new AbstractRunner('node', ['--enable-source-maps']);
      await runner.run('dist/main.js');

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['--enable-source-maps', 'dist/main.js'],
        expect.any(Object),
      );
    });
  });
});
