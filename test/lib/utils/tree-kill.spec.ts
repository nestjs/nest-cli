import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const execSyncMock = vi.fn();
const spawnSyncMock = vi.fn();

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execSync: (...args: unknown[]) => execSyncMock(...args),
    spawnSync: (...args: unknown[]) => spawnSyncMock(...args),
  };
});

import { treeKillSync } from '../../../lib/utils/tree-kill.js';

describe('treeKillSync', () => {
  let originalPlatform: PropertyDescriptor | undefined;
  let processKillSpy: ReturnType<typeof vi.spyOn>;

  function setPlatform(platform: NodeJS.Platform): void {
    Object.defineProperty(process, 'platform', {
      value: platform,
      configurable: true,
      writable: true,
    });
  }

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    execSyncMock.mockReset();
    spawnSyncMock.mockReset();
    processKillSpy = vi
      .spyOn(process, 'kill')
      .mockImplementation(() => true as unknown as true);
  });

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
    processKillSpy.mockRestore();
  });

  describe('on win32', () => {
    beforeEach(() => {
      setPlatform('win32');
    });

    it('should call execSync with taskkill and not invoke spawnSync or process.kill', () => {
      treeKillSync(1234);

      expect(execSyncMock).toHaveBeenCalledTimes(1);
      expect(execSyncMock).toHaveBeenCalledWith('taskkill /pid 1234 /T /F', {
        stdio: 'pipe',
      });
      expect(spawnSyncMock).not.toHaveBeenCalled();
      expect(processKillSpy).not.toHaveBeenCalled();
    });

    it('should pipe taskkill output instead of echoing it', () => {
      treeKillSync(1234);

      expect(execSyncMock.mock.calls[0][1]).toMatchObject({ stdio: 'pipe' });
    });

    it('should swallow a taskkill error when the process is not found (status 128)', () => {
      execSyncMock.mockImplementation(() => {
        throw Object.assign(new Error('Command failed: taskkill'), {
          status: 128,
        });
      });

      expect(() => treeKillSync(1234)).not.toThrow();
      expect(execSyncMock).toHaveBeenCalledTimes(1);
    });

    it.each([1, 5])(
      'should rethrow a taskkill error with status %i',
      (status) => {
        execSyncMock.mockImplementation(() => {
          throw Object.assign(new Error('taskkill failed'), { status });
        });

        expect(() => treeKillSync(1234)).toThrow('taskkill failed');
      },
    );

    it('should rethrow the original value when a non-object is thrown', () => {
      execSyncMock.mockImplementation(() => {
        throw null;
      });

      let thrown: unknown = undefined;
      try {
        treeKillSync(1234);
      } catch (err) {
        thrown = err;
      }

      expect(thrown).toBeNull();
    });

    it('should rethrow the original value when a string is thrown', () => {
      execSyncMock.mockImplementation(() => {
        throw 'taskkill failed';
      });

      let thrown: unknown = undefined;
      try {
        treeKillSync(1234);
      } catch (err) {
        thrown = err;
      }

      expect(thrown).toBe('taskkill failed');
    });

    it('should rethrow a taskkill error without a status', () => {
      execSyncMock.mockImplementation(() => {
        throw new Error('spawn failed');
      });

      expect(() => treeKillSync(1234)).toThrow('spawn failed');
    });

    it('should ignore the signal argument on win32', () => {
      treeKillSync(42, 'SIGTERM');

      expect(execSyncMock).toHaveBeenCalledWith('taskkill /pid 42 /T /F', {
        stdio: 'pipe',
      });
      expect(processKillSpy).not.toHaveBeenCalled();
    });
  });

  describe('on posix', () => {
    beforeEach(() => {
      setPlatform('linux');
    });

    it('should call spawnSync with ps -A -o pid,ppid', () => {
      spawnSyncMock.mockReturnValue({ stdout: '' });

      treeKillSync(100);

      expect(spawnSyncMock).toHaveBeenCalledTimes(1);
      expect(spawnSyncMock).toHaveBeenCalledWith(
        'ps',
        ['-A', '-o', 'pid,ppid'],
        { encoding: 'utf-8', stdio: 'pipe' },
      );
      expect(execSyncMock).not.toHaveBeenCalled();
    });

    it('should kill all child pids and the original pid in order', () => {
      spawnSyncMock.mockReturnValue({
        stdout: [
          '   PID  PPID',
          '   100     1',
          '   200   100',
          '   300   200',
          '   400   100',
          '   500     1',
        ].join('\n'),
      });

      treeKillSync(100, 'SIGTERM');

      // Children of 100 (recursively): 200, 300, 400 - then 100 itself.
      const callPids = processKillSpy.mock.calls.map((c) => c[0]);
      expect(callPids).toEqual([200, 300, 400, 100]);
      processKillSpy.mock.calls.forEach((call) => {
        expect(call[1]).toBe('SIGTERM');
      });
    });

    it('should kill only the original pid when spawnSync returns an error', () => {
      spawnSyncMock.mockReturnValue({ error: new Error('ps not found') });

      treeKillSync(777);

      expect(processKillSpy).toHaveBeenCalledTimes(1);
      expect(processKillSpy).toHaveBeenCalledWith(777, undefined);
    });

    it('should kill only the original pid when spawnSync returns empty stdout', () => {
      spawnSyncMock.mockReturnValue({ stdout: '' });

      treeKillSync(888, 9);

      expect(processKillSpy).toHaveBeenCalledTimes(1);
      expect(processKillSpy).toHaveBeenCalledWith(888, 9);
    });

    it('should skip header row and parse subsequent rows correctly', () => {
      spawnSyncMock.mockReturnValue({
        stdout: ' PID PPID\n 123   1\n 456 123\n',
      });

      treeKillSync(123);

      const callPids = processKillSpy.mock.calls.map((c) => c[0]);
      expect(callPids).toEqual([456, 123]);
    });

    it('should swallow ESRCH errors thrown by process.kill', () => {
      spawnSyncMock.mockReturnValue({ stdout: '' });
      const esrch = Object.assign(new Error('No such process'), {
        code: 'ESRCH',
      });
      processKillSpy.mockImplementation(() => {
        throw esrch;
      });

      expect(() => treeKillSync(999)).not.toThrow();
      expect(processKillSpy).toHaveBeenCalledWith(999, undefined);
    });

    it('should propagate non-ESRCH errors thrown by process.kill', () => {
      spawnSyncMock.mockReturnValue({ stdout: '' });
      const eperm = Object.assign(new Error('not permitted'), {
        code: 'EPERM',
      });
      processKillSpy.mockImplementation(() => {
        throw eperm;
      });

      expect(() => treeKillSync(1001)).toThrow('not permitted');
    });
  });
});
