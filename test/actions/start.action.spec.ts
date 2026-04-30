import { EventEmitter } from 'events';

// Mock all heavy dependencies before importing StartAction
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  execSync: jest.fn(),
  spawnSync: jest.fn(() => ({ stdout: '', error: null })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(),
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
  globSync: jest.fn(() => []),
}));

jest.mock('../../lib/compiler/assets-manager', () => ({
  AssetsManager: jest.fn().mockImplementation(() => ({
    closeWatchers: jest.fn(),
  })),
}));

jest.mock('../../lib/utils/tree-kill', () => ({
  treeKillSync: jest.fn(),
}));

import { StartAction } from '../../actions/start.action';

describe('StartAction', () => {
  let startAction: StartAction;
  let processOnSpy: jest.SpyInstance;
  let originalArgv: string[];
  const registeredHandlers: Record<string, Function[]> = {};

  beforeEach(() => {
    startAction = new StartAction();
    (startAction as any).tsConfigProvider = {
      getByConfigFilename: jest.fn(() => ({ options: { outDir: 'dist' } })),
    };
    (startAction as any).loader = {
      load: jest.fn(() => ({})),
    };

    for (const key of Object.keys(registeredHandlers)) {
      delete registeredHandlers[key];
    }

    processOnSpy = jest
      .spyOn(process, 'on')
      .mockImplementation((event: string | symbol, handler: Function) => {
        const key = String(event);
        registeredHandlers[key] = registeredHandlers[key] || [];
        registeredHandlers[key].push(handler);
        return process;
      });

    originalArgv = process.argv;
    process.argv = ['node', 'nest', 'start'];
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    process.argv = originalArgv;
    jest.restoreAllMocks();
  });

  describe('createOnSuccessHook - signal handling', () => {
    it('should register SIGINT and SIGTERM handlers (regression for #3158)', () => {
      startAction.createOnSuccessHook('main', 'src', false, 'dist', 'node', {
        shell: false,
      });

      expect(registeredHandlers['SIGINT']).toBeDefined();
      expect(registeredHandlers['SIGINT'].length).toBeGreaterThanOrEqual(1);
      expect(registeredHandlers['SIGTERM']).toBeDefined();
      expect(registeredHandlers['SIGTERM'].length).toBeGreaterThanOrEqual(1);
    });

    it('should forward SIGINT to the child process so async shutdown hooks can run', () => {
      const { spawn } = require('child_process');
      const mockChild = new EventEmitter();
      (mockChild as any).pid = 12345;
      (mockChild as any).stdin = null;
      (mockChild as any).kill = jest.fn();
      spawn.mockReturnValue(mockChild);

      const onSuccess = startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      // Spawn the child
      onSuccess();

      // Simulate receiving SIGINT
      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');

      // The signal should be forwarded to the child via kill(),
      // not via treeKillSync which would terminate it without giving
      // it a chance to run shutdown hooks.
      expect((mockChild as any).kill).toHaveBeenCalledWith('SIGINT');
    });

    it('should forward SIGTERM to the child process', () => {
      const { spawn } = require('child_process');
      const mockChild = new EventEmitter();
      (mockChild as any).pid = 12345;
      (mockChild as any).stdin = null;
      (mockChild as any).kill = jest.fn();
      spawn.mockReturnValue(mockChild);

      const onSuccess = startAction.createOnSuccessHook(
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

      expect((mockChild as any).kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should call process.exit when no child process is running on signal', () => {
      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as any);

      startAction.createOnSuccessHook('main', 'src', false, 'dist', 'node', {
        shell: false,
      });

      // Do NOT invoke onSuccess, so no child process exists
      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');

      expect(exitSpy).toHaveBeenCalled();
      exitSpy.mockRestore();
    });
  });

  describe('createOnSuccessHook - parent exit on child exit during shutdown', () => {
    it('should call process.exit when child exits after a SIGINT (regression for #3391, single Ctrl+C)', () => {
      const { spawn } = require('child_process');
      const mockChild = new EventEmitter();
      (mockChild as any).pid = 12345;
      (mockChild as any).stdin = null;
      (mockChild as any).kill = jest.fn();
      spawn.mockReturnValue(mockChild);

      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as any);

      const onSuccess = startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();

      // User hits Ctrl+C; we forward to the child but the watcher
      // keeps the event loop alive, so the parent must exit explicitly
      // when the child exits.
      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');

      // Child exits cleanly after running async shutdown hooks
      mockChild.emit('exit', 0);

      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });

    it('should NOT call process.exit when child exits naturally (no signal received)', () => {
      const { spawn } = require('child_process');
      const mockChild = new EventEmitter();
      (mockChild as any).pid = 12345;
      (mockChild as any).stdin = null;
      (mockChild as any).kill = jest.fn();
      spawn.mockReturnValue(mockChild);

      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as any);

      const onSuccess = startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      onSuccess();

      // Child exits on its own (e.g. process.exit(0) in app code, or crash).
      // We must NOT call process.exit here — in watch mode this would
      // terminate the watcher and prevent restart on file change.
      mockChild.emit('exit', 0);

      expect(exitSpy).not.toHaveBeenCalled();
      exitSpy.mockRestore();
    });

    it('should call process.exit on child exit during watch-mode restart cycle after SIGINT (regression for cluster + watch double Ctrl+C)', () => {
      const { spawn } = require('child_process');
      const firstChild = new EventEmitter();
      (firstChild as any).pid = 1111;
      (firstChild as any).stdin = null;
      (firstChild as any).kill = jest.fn();

      const secondChild = new EventEmitter();
      (secondChild as any).pid = 2222;
      (secondChild as any).stdin = null;
      (secondChild as any).kill = jest.fn();

      spawn.mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild);

      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as any);

      const onSuccess = startAction.createOnSuccessHook(
        'main',
        'src',
        false,
        'dist',
        'node',
        { shell: false },
      );

      // First compile success spawns the first child
      onSuccess();
      // Second compile success (watch-mode rebuild) re-spawns
      onSuccess();

      // The watch restart path replaces the exit listener and spawns a
      // second child when the first one exits.
      firstChild.emit('exit', 0);

      // User hits Ctrl+C while the second child is running
      const sigintHandler =
        registeredHandlers['SIGINT'][registeredHandlers['SIGINT'].length - 1];
      sigintHandler('SIGINT');

      // Second child exits after running shutdown hooks
      secondChild.emit('exit', 0);

      // Parent must exit so user does not need a second Ctrl+C
      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });
  });
});
