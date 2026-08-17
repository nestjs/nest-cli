import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/compiler/helpers/manual-restart.js', () => ({
  displayManualRestartTip: vi.fn(),
  listenForManualRestart: vi.fn(),
}));

vi.mock('../../../lib/compiler/hooks/tsconfig-paths.hook.js', () => ({
  tsconfigPathsBeforeHookFactory: vi.fn(() => undefined),
}));

import { WatchCompiler } from '../../../lib/compiler/watch-compiler.js';
import { Configuration } from '../../../lib/configuration/index.js';
import {
  displayManualRestartTip,
  listenForManualRestart,
} from '../../../lib/compiler/helpers/manual-restart.js';
import { tsconfigPathsBeforeHookFactory } from '../../../lib/compiler/hooks/tsconfig-paths.hook.js';

describe('WatchCompiler', () => {
  // The real getValueOrDefault is used, so behaviour is driven by the
  // configuration object exactly as it is in a project's nest-cli.json.
  const makeConfiguration = (manualRestart = false) =>
    ({
      sourceRoot: 'src',
      compilerOptions: { plugins: [], manualRestart },
    }) as unknown as Required<Configuration>;

  let configuration = makeConfiguration();

  let tsBin: Record<string, any>;
  let watchProgram: Record<string, any>;
  let pluginsLoader: any;
  let tsConfigProvider: any;
  let compiler: WatchCompiler;

  beforeEach(() => {
    vi.clearAllMocks();
    configuration = makeConfiguration();
    vi.mocked(tsconfigPathsBeforeHookFactory).mockReturnValue(undefined);

    watchProgram = { close: vi.fn() };
    tsBin = {
      sys: { fileExists: vi.fn(() => true) },
      findConfigFile: vi.fn(() => '/project/tsconfig.json'),
      createEmitAndSemanticDiagnosticsBuilderProgram: vi.fn(),
      createDiagnosticReporter: vi.fn(() => vi.fn()),
      createWatchStatusReporter: vi.fn(() => vi.fn()),
      createWatchCompilerHost: vi.fn(() => ({ createProgram: vi.fn() })),
      createWatchProgram: vi.fn(() => watchProgram),
    };

    pluginsLoader = {
      load: vi.fn(() => ({
        beforeHooks: [],
        afterHooks: [],
        afterDeclarationsHooks: [],
      })),
    };
    tsConfigProvider = {
      getByConfigFilename: vi.fn(() => ({
        options: { outDir: 'dist', preserveWatchOutput: false },
        fileNames: ['/project/src/main.ts'],
        projectReferences: undefined,
      })),
    };

    compiler = new WatchCompiler(pluginsLoader, tsConfigProvider, {
      load: vi.fn(() => tsBin),
    } as any);
  });

  const run = (extras = { preserveWatchOutput: undefined as any }) =>
    compiler.run(configuration, 'tsconfig.json', undefined, extras);

  it('throws a helpful error when the tsconfig cannot be located', () => {
    tsBin.findConfigFile.mockReturnValue(undefined);

    expect(() => run()).toThrow(/tsconfig\.json/);
  });

  it('starts a watch program from the resolved config path', () => {
    run();

    expect(tsBin.createWatchCompilerHost).toHaveBeenCalledWith(
      '/project/tsconfig.json',
      expect.any(Object),
      tsBin.sys,
      tsBin.createEmitAndSemanticDiagnosticsBuilderProgram,
      expect.any(Function),
      expect.any(Function),
    );
    expect(tsBin.createWatchProgram).toHaveBeenCalled();
  });

  it('lets the CLI flag override preserveWatchOutput from the tsconfig', () => {
    run({ preserveWatchOutput: true });

    expect(tsBin.createWatchCompilerHost.mock.calls[0][1]).toMatchObject({
      preserveWatchOutput: true,
    });
  });

  it('falls back to the tsconfig preserveWatchOutput when the flag is absent', () => {
    run({ preserveWatchOutput: undefined });

    expect(tsBin.createWatchCompilerHost.mock.calls[0][1]).toMatchObject({
      preserveWatchOutput: false,
    });
  });

  describe('manual restart', () => {
    it('does not listen for restarts when the option is off', () => {
      run();

      expect(listenForManualRestart).not.toHaveBeenCalled();
    });

    it('closes the current watch program and restarts on request', () => {
      configuration = makeConfiguration(true);

      run();

      expect(listenForManualRestart).toHaveBeenCalledTimes(1);

      // Trigger the registered restart handler.
      const restart = vi.mocked(listenForManualRestart).mock.calls[0][0];
      restart();

      expect(watchProgram.close).toHaveBeenCalledTimes(1);
      expect(tsBin.createWatchProgram).toHaveBeenCalledTimes(2);
    });
  });

  describe('watch status reporting', () => {
    const statusReporterFor = () => {
      run();
      return tsBin.createWatchCompilerHost.mock.calls[0][5];
    };

    it('invokes onSuccess when a compilation reports zero errors', () => {
      const onSuccess = vi.fn();
      compiler.run(
        configuration,
        'tsconfig.json',
        undefined,
        { preserveWatchOutput: undefined },
        onSuccess,
      );
      const onWatchStatusChanged =
        tsBin.createWatchCompilerHost.mock.calls[0][5];

      onWatchStatusChanged({ messageText: 'Found 0 errors. Watching...' });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('does not invoke onSuccess when errors are reported', () => {
      const onSuccess = vi.fn();
      compiler.run(
        configuration,
        'tsconfig.json',
        undefined,
        { preserveWatchOutput: undefined },
        onSuccess,
      );
      const onWatchStatusChanged =
        tsBin.createWatchCompilerHost.mock.calls[0][5];

      onWatchStatusChanged({ messageText: 'Found 3 errors. Watching...' });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('tolerates a non-string diagnostic message', () => {
      expect(() =>
        statusReporterFor()({ messageText: { messageText: 'chained' } }),
      ).not.toThrow();
    });
  });

  describe('createProgram override', () => {
    const overriddenCreateProgram = () => {
      const origEmit = vi.fn();
      const origCreateProgram = vi.fn(() => ({
        emit: origEmit,
        getProgram: vi.fn(() => ({ __program: true })),
      }));
      tsBin.createWatchCompilerHost.mockReturnValue({
        createProgram: origCreateProgram,
      });
      run();
      const host = tsBin.createWatchCompilerHost.mock.results[0].value;
      return { host, origCreateProgram, origEmit };
    };

    it('forwards project references into the underlying createProgram', () => {
      tsConfigProvider.getByConfigFilename.mockReturnValue({
        options: {},
        fileNames: [],
        projectReferences: [{ path: '../lib' }],
      });
      const { host, origCreateProgram } = overriddenCreateProgram();

      host.createProgram(['main.ts'], {}, {}, undefined);

      expect(origCreateProgram).toHaveBeenCalledWith(
        ['main.ts'],
        {},
        {},
        undefined,
        undefined,
        [{ path: '../lib' }],
      );
    });

    it('applies plugin transformers when the program emits', () => {
      pluginsLoader.load.mockReturnValue({
        beforeHooks: [() => 'before-transformer'],
        afterHooks: [() => 'after-transformer'],
        afterDeclarationsHooks: [() => 'after-declarations-transformer'],
      });
      const { host, origEmit } = overriddenCreateProgram();

      const program = host.createProgram(['main.ts'], {}, {}, undefined);
      program.emit();

      const transforms = origEmit.mock.calls[0][4];
      expect(transforms.before).toEqual(['before-transformer']);
      expect(transforms.after).toEqual(['after-transformer']);
      expect(transforms.afterDeclarations).toEqual([
        'after-declarations-transformer',
      ]);
    });

    it('preserves transformers supplied by the caller of emit', () => {
      pluginsLoader.load.mockReturnValue({
        beforeHooks: [() => 'plugin-before'],
        afterHooks: [],
        afterDeclarationsHooks: [],
      });
      const { host, origEmit } = overriddenCreateProgram();

      const program = host.createProgram(['main.ts'], {}, {}, undefined);
      program.emit(undefined, undefined, undefined, undefined, {
        before: ['caller-before'],
      });

      expect(origEmit.mock.calls[0][4].before).toEqual([
        'plugin-before',
        'caller-before',
      ]);
    });

    it('prepends the tsconfig-paths transformer when path aliases exist', () => {
      vi.mocked(tsconfigPathsBeforeHookFactory).mockReturnValue(
        'paths-transformer' as any,
      );
      pluginsLoader.load.mockReturnValue({
        beforeHooks: [() => 'plugin-before'],
        afterHooks: [],
        afterDeclarationsHooks: [],
      });
      const { host, origEmit } = overriddenCreateProgram();

      const program = host.createProgram(['main.ts'], {}, {}, undefined);
      program.emit();

      const transforms = origEmit.mock.calls[0][4];
      expect(transforms.before).toEqual(['paths-transformer', 'plugin-before']);
      expect(transforms.afterDeclarations).toEqual(['paths-transformer']);
    });

    it('shows the manual restart tip on each rebuild when enabled', () => {
      configuration = makeConfiguration(true);
      const { host } = overriddenCreateProgram();

      host.createProgram(['main.ts'], {}, {}, undefined);

      expect(displayManualRestartTip).toHaveBeenCalled();
    });
  });
});
