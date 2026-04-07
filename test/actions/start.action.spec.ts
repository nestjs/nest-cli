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
      const exitSpy = jest
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
