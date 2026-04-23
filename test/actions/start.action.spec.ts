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
  const registeredHandlers: Record<
    string,
    Array<(signal?: NodeJS.Signals) => void>
  > = {};

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

  describe('spawnChildProcess - env file arguments', () => {
    beforeEach(() => {
      vi.mocked(spawn).mockClear();
    });

    it('should pass multiple --env-file flags as separate spawn arguments', () => {
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
        { shell: false, envFile: ['.env', '.env.local'] },
      );

      onSuccess();

      const spawnCall = vi.mocked(spawn).mock.calls[0];
      // Non-shell mode: spawn(binary, args, options)
      const processArgs = spawnCall[1] as string[];

      // Each --env-file flag should be a separate element in the args array
      expect(processArgs).toContain('--env-file=.env');
      expect(processArgs).toContain('--env-file=.env.local');

      // They should NOT be joined into a single string
      const joinedArg = processArgs.find(
        (arg) => arg === '--env-file=.env --env-file=.env.local',
      );
      expect(joinedArg).toBeUndefined();
    });

    it('should pass a single --env-file flag as a separate spawn argument', () => {
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
        { shell: false, envFile: ['.env'] },
      );

      onSuccess();

      const spawnCall = vi.mocked(spawn).mock.calls[0];
      const processArgs = spawnCall[1] as string[];

      expect(processArgs).toContain('--env-file=.env');
    });

    it('should place --env-file flags after --enable-source-maps', () => {
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
        { shell: false, envFile: ['.env'] },
      );

      onSuccess();

      const spawnCall = vi.mocked(spawn).mock.calls[0];
      const processArgs = spawnCall[1] as string[];

      const sourceMapIdx = processArgs.indexOf('--enable-source-maps');
      const envFileIdx = processArgs.indexOf('--env-file=.env');

      // --enable-source-maps is unshifted last, so it should come first
      expect(sourceMapIdx).toBeLessThan(envFileIdx);
    });

    it('should not include --env-file flags when envFile is empty', () => {
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
        { shell: false, envFile: [] },
      );

      onSuccess();

      const spawnCall = vi.mocked(spawn).mock.calls[0];
      const processArgs = spawnCall[1] as string[];

      const envFileArgs = processArgs.filter((arg) =>
        arg.startsWith('--env-file'),
      );
      expect(envFileArgs).toHaveLength(0);
    });
  });
});
