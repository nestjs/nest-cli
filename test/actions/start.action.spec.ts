import { EventEmitter } from 'events';
import { spawn } from 'child_process';
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

vi.mock('glob', () => ({
  glob: vi.fn(),
  globSync: vi.fn(() => []),
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
  const registeredHandlers: Record<string, Array<(signal?: NodeJS.Signals) => void>> = {};

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
  });

  afterEach(() => {
    processOnSpy?.mockRestore();
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe('createOnSuccessHook - signal handling', () => {
    it('should register SIGINT and SIGTERM handlers', () => {
      startAction.createOnSuccessHook(
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

    it('should forward SIGINT to the child process instead of killing it immediately', () => {
      const mockChild = new EventEmitter();
      (mockChild as any).pid = 12345;
      (mockChild as any).stdin = null;
      (mockChild as any).kill = vi.fn();
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const onSuccess = startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      // Invoke the hook to spawn the child process
      onSuccess();

      // Simulate receiving SIGINT
      const sigintHandler =
        registeredHandlers['SIGINT'][
          registeredHandlers['SIGINT'].length - 1
        ];
      sigintHandler('SIGINT');

      // The signal should be forwarded to the child via kill(), not via treeKillSync
      expect((mockChild as any).kill).toHaveBeenCalledWith('SIGINT');
    });

    it('should forward SIGTERM to the child process instead of killing it immediately', () => {
      const mockChild = new EventEmitter();
      (mockChild as any).pid = 12345;
      (mockChild as any).stdin = null;
      (mockChild as any).kill = vi.fn();
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const onSuccess = startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      // Invoke the hook to spawn the child process
      onSuccess();

      // Simulate receiving SIGTERM
      const sigtermHandler =
        registeredHandlers['SIGTERM'][
          registeredHandlers['SIGTERM'].length - 1
        ];
      sigtermHandler('SIGTERM');

      // The signal should be forwarded to the child via kill()
      expect((mockChild as any).kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should call process.exit when no child process is running on signal', () => {
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as any);

      startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      // Do NOT invoke onSuccess, so no child process exists
      const sigintHandler =
        registeredHandlers['SIGINT'][
          registeredHandlers['SIGINT'].length - 1
        ];
      sigintHandler('SIGINT');

      expect(exitSpy).toHaveBeenCalled();
      exitSpy.mockRestore();
    });
  });
});
