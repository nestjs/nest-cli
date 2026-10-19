import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
  spawnSync: vi.fn(() => ({ stdout: '', error: null })),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(),
}));

vi.mock('../../lib/compiler/assets-manager.js', () => ({
  AssetsManager: vi.fn(
    class {
      closeWatchers = vi.fn();
    },
  ),
}));

vi.mock('../../lib/utils/tree-kill.js', () => ({
  treeKillSync: vi.fn(),
}));

import { StartAction } from '../../actions/start.action.js';

describe('StartAction', () => {
  let startAction: StartAction;
  let processOnSpy: ReturnType<typeof vi.spyOn>;
  let originalArgv: string[];
  const registeredHandlers: Record<
    string,
    Array<(signal?: NodeJS.Signals) => void>
  > = {};

  const createMockChild = () => {
    const mockChild = new EventEmitter();
    (mockChild as any).pid = 12345;
    (mockChild as any).stdin = null;
    (mockChild as any).kill = vi.fn();
    return mockChild as any;
  };

  beforeEach(() => {
    startAction = new StartAction();
    (startAction as any).tsConfigProvider = {
      getByConfigFilename: vi.fn(() => ({ options: { outDir: 'dist' } })),
    };
    (startAction as any).loader = {
      load: vi.fn(() => ({})),
    };

    for (const key of Object.keys(registeredHandlers)) {
      delete registeredHandlers[key];
    }

    processOnSpy = vi
      .spyOn(process, 'on')
      .mockImplementation((event: string | symbol, handler: any) => {
        const key = String(event);
        registeredHandlers[key] = registeredHandlers[key] || [];
        registeredHandlers[key].push(handler);
        return process;
      });

    originalArgv = process.argv;
    process.argv = ['node', 'nest', 'start'];
    vi.mocked(spawn).mockClear();
  });

  afterEach(() => {
    processOnSpy?.mockRestore();
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe('spawnChildProcess - env file arguments', () => {
    it('should pass multiple --env-file flags as separate spawn arguments', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false, envFile: ['.env', '.env.local'] },
      );

      onSuccess();

      const processArgs = vi.mocked(spawn).mock.calls[0][1] as string[];

      expect(processArgs).toContain('--env-file=.env');
      expect(processArgs).toContain('--env-file=.env.local');
      expect(
        processArgs.find(
          (arg) => arg === '--env-file=.env --env-file=.env.local',
        ),
      ).toBeUndefined();
    });

    it('should pass a single --env-file flag as a separate spawn argument', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false, envFile: ['.env'] },
      );

      onSuccess();

      const processArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(processArgs).toContain('--env-file=.env');
    });

    it('should place --env-file flags after --enable-source-maps', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false, envFile: ['.env'] },
      );

      onSuccess();

      const processArgs = vi.mocked(spawn).mock.calls[0][1] as string[];

      expect(processArgs.indexOf('--enable-source-maps')).toBeLessThan(
        processArgs.indexOf('--env-file=.env'),
      );
    });

    it('should skip an env file that does not exist, and say so once', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockImplementation(
        (path) => path !== '.env' && path !== '.env.missing',
      );
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false, envFile: ['.env.missing', '.env.local'] },
      );

      // A fresh clone has no .env: start anyway rather than let Node exit.
      onSuccess();
      onSuccess();

      const processArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(processArgs).toContain('--env-file=.env.local');
      expect(processArgs).not.toContain('--env-file=.env.missing');
      // Watch mode restarts on every change; the notice is not repeated.
      expect(
        info.mock.calls.filter(([line]) =>
          String(line).includes('.env.missing not found'),
        ),
      ).toHaveLength(1);

      vi.mocked(existsSync).mockImplementation(() => true);
      info.mockRestore();
    });

    it('should not include --env-file flags when envFile is empty', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false, envFile: [] },
      );

      onSuccess();

      const processArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(
        processArgs.filter((arg) => arg.startsWith('--env-file')),
      ).toHaveLength(0);
    });
  });

  describe('createOnSuccessHook - signal handling', () => {
    it('should register SIGINT and SIGTERM handlers', () => {
      (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      expect(registeredHandlers['SIGINT']).toBeDefined();
      expect(registeredHandlers['SIGINT'].length).toBeGreaterThanOrEqual(1);
      expect(registeredHandlers['SIGTERM']).toBeDefined();
      expect(registeredHandlers['SIGTERM'].length).toBeGreaterThanOrEqual(1);
    });

    it('should forward SIGINT to the child process', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();

      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');

      expect(mockChild.kill).toHaveBeenCalledWith('SIGINT');
    });

    it('should forward SIGTERM to the child process', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();

      const sigtermHandler =
        registeredHandlers['SIGTERM'][registeredHandlers['SIGTERM'].length - 1];
      sigtermHandler('SIGTERM');

      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should call process.exit when no child process is running on signal', () => {
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');

      expect(exitSpy).toHaveBeenCalled();
    });
  });

  describe('createOnSuccessHook - parent exit on child exit during shutdown', () => {
    it('should call process.exit when child exits after SIGINT', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();

      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');
      mockChild.emit('exit', 0);

      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should not call process.exit when child exits naturally', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();
      mockChild.emit('exit', 0);

      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should call process.exit on child exit during watch-mode restart after SIGINT', () => {
      const firstChild = createMockChild();
      const secondChild = createMockChild();
      vi.mocked(spawn)
        .mockReturnValueOnce(firstChild)
        .mockReturnValueOnce(secondChild);

      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      const onSuccess = (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();
      onSuccess();
      firstChild.emit('exit', 0);

      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');
      secondChild.emit('exit', 0);

      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('createOnSuccessHook - app exit report in watch mode', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    const waitingMessage = 'Waiting for file changes before restarting...';

    const createHook = (watch: boolean) =>
      (startAction as any).createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false, watch },
      );

    const reported = () =>
      [...consoleLogSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .map((args) => String(args[0]))
        .filter((line) => line.includes(waitingMessage));

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    });

    afterEach(() => {
      process.exitCode = undefined;
    });

    it('should report a crash with its exit code and keep waiting', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = createHook(true);
      onSuccess();
      mockChild.emit('exit', 1, null);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `The application exited with code 1. ${waitingMessage}`,
        ),
      );
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('should report the signal when the app is killed by one', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = createHook(true);
      onSuccess();
      mockChild.emit('exit', null, 'SIGKILL');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `The application was terminated by SIGKILL. ${waitingMessage}`,
        ),
      );
    });

    it('should report a clean exit as information rather than an error', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = createHook(true);
      onSuccess();
      mockChild.emit('exit', 0, null);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `The application exited with code 0. ${waitingMessage}`,
        ),
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should report an exit of an app the watcher has restarted', () => {
      const firstChild = createMockChild();
      const secondChild = createMockChild();
      vi.mocked(spawn)
        .mockReturnValueOnce(firstChild)
        .mockReturnValueOnce(secondChild);

      const onSuccess = createHook(true);
      onSuccess();
      onSuccess();
      firstChild.emit('exit', null, 'SIGTERM');

      // The watcher killed the first app to restart it: nothing to report.
      expect(reported()).toHaveLength(0);

      secondChild.emit('exit', 1, null);

      expect(reported()).toEqual([
        expect.stringContaining('The application exited with code 1.'),
      ]);
    });

    it('should not report when the app exits because of Ctrl+C', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = createHook(true);
      onSuccess();
      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');
      mockChild.emit('exit', 0, null);

      expect(reported()).toHaveLength(0);
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should not report when a restarted app exits because of Ctrl+C', () => {
      const firstChild = createMockChild();
      const secondChild = createMockChild();
      vi.mocked(spawn)
        .mockReturnValueOnce(firstChild)
        .mockReturnValueOnce(secondChild);

      const onSuccess = createHook(true);
      onSuccess();
      onSuccess();
      firstChild.emit('exit', null, 'SIGTERM');
      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');
      secondChild.emit('exit', 0, null);

      expect(reported()).toHaveLength(0);
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should take watch mode from the start command context', async () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);
      vi.spyOn(startAction, 'runBuild').mockImplementation(
        async (...args: any[]) => args[5](),
      );

      await startAction.handle({ watch: true } as any);
      mockChild.emit('exit', 1, null);

      expect(reported()).toHaveLength(1);
    });

    it('should not report outside watch mode, where the CLI exits too', () => {
      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const onSuccess = createHook(false);
      onSuccess();
      mockChild.emit('exit', 1, null);

      expect(reported()).toHaveLength(0);
    });
  });

  describe('handle - build failure exit code', () => {
    it('should exit with code 1 when the build fails', async () => {
      // The SWC type checker rejects rather than exiting the process itself,
      // so swallowing the error here would report success to CI while the
      // application never started.
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as never);
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (startAction as any).loader = {
        load: vi.fn().mockRejectedValue(new Error('Found 2 type error(s)')),
      };

      await startAction.handle({} as any);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 type error(s)'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
