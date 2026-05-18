import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChildProcess, SpawnOptions } from 'child_process';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

const spawnMock = vi.fn();

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    spawn: (...args: unknown[]) => spawnMock(...args),
  };
});

import { AbstractRunner } from '../../../lib/runners/abstract.runner.js';

class TestRunner extends AbstractRunner {
  constructor(binary = 'test-bin', args: string[] = []) {
    super(binary, args);
  }
}

function createMockChildProcess(): ChildProcess {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({ read() {} }) as Readable;
  child.stderr = new Readable({ read() {} }) as Readable;
  child.stdin = null;
  child.pid = 1234;
  child.killed = false;
  child.connected = false;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = vi.fn();
  child.send = vi.fn();
  child.disconnect = vi.fn();
  child.unref = vi.fn();
  child.ref = vi.fn();
  return child;
}

describe('AbstractRunner', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('run', () => {
    it('should spawn the full command with shell option', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('install', false);

      child.emit('close', 0);
      await promise;

      expect(spawnMock).toHaveBeenCalledWith('npm install', {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      });
    });

    it('should include constructor args in the spawned command', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('node', ['--experimental-modules']);
      const promise = runner.run('script.js', false);

      child.emit('close', 0);
      await promise;

      expect(spawnMock).toHaveBeenCalledWith(
        'node --experimental-modules script.js',
        expect.any(Object),
      );
    });

    it('should resolve with null when collect is false and exit code is 0', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('install', false);

      child.emit('close', 0);
      const result = await promise;

      expect(result).toBeNull();
    });

    it('should reject when exit code is non-zero and collect is false', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('install', false);

      child.emit('close', 1);

      await expect(promise).rejects.toBeUndefined();
    });

    it('should use pipe stdio when collect is true', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('--version', true);

      child.stdout!.emit('data', Buffer.from('10.0.0\n'));
      child.emit('close', 0);

      await promise;

      expect(spawnMock).toHaveBeenCalledWith(
        'npm --version',
        expect.objectContaining({ stdio: 'pipe' }),
      );
    });

    it('should collect all stdout chunks when collect is true', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('--version', true);

      // Simulate multiple data chunks
      child.stdout!.emit('data', Buffer.from('10.'));
      child.stdout!.emit('data', Buffer.from('0.'));
      child.stdout!.emit('data', Buffer.from('0\n'));
      child.emit('close', 0);

      const result = await promise;
      expect(result).toBe('10.0.0');
    });

    it('should strip all newlines from collected output', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('--version', true);

      child.stdout!.emit('data', Buffer.from('10.0.0\r\n'));
      child.emit('close', 0);

      const result = await promise;
      expect(result).toBe('10.0.0');
    });

    it('should strip multiple newlines from collected output', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('some-tool');
      const promise = runner.run('info', true);

      child.stdout!.emit('data', Buffer.from('line1\nline2\nline3\n'));
      child.emit('close', 0);

      const result = await promise;
      expect(result).toBe('line1line2line3');
    });

    it('should reject when collect is true and exit code is non-zero', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('install bad-pkg', true);

      child.stdout!.emit('data', Buffer.from('error output'));
      child.emit('close', 1);

      await expect(promise).rejects.toBeUndefined();
    });

    it('should use the provided cwd option', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const customCwd = '/custom/path';
      const promise = runner.run('install', false, customCwd);

      child.emit('close', 0);
      await promise;

      expect(spawnMock).toHaveBeenCalledWith(
        'npm install',
        expect.objectContaining({ cwd: customCwd }),
      );
    });

    it('should not duplicate binary name in error message', async () => {
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const runner = new TestRunner('npm');
      const promise = runner.run('--version', false);

      child.emit('close', 1);

      await expect(promise).rejects.toBeUndefined();

      const errorArg = consoleErrorSpy.mock.calls[0]?.[0] as string;
      // The error message should contain "npm --version" exactly once,
      // not "npm npm --version" (which was the old shadowing bug)
      expect(errorArg).toContain('npm --version');
      expect(errorArg).not.toContain('npm npm --version');
    });
  });

  describe('rawFullCommand', () => {
    it('should return the full command string', () => {
      const runner = new TestRunner('npm');
      const result = runner.rawFullCommand('install');
      expect(result).toBe('npm install');
    });

    it('should include constructor args in the full command', () => {
      const runner = new TestRunner('node', ['--experimental-modules']);
      const result = runner.rawFullCommand('script.js');
      expect(result).toBe('node --experimental-modules script.js');
    });
  });
});
