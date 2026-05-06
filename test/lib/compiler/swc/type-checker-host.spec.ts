import * as ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TSC_NO_ERRORS_MESSAGE } from '../../../../lib/compiler/swc/constants.js';
import { TypeCheckerHost } from '../../../../lib/compiler/swc/type-checker-host.js';

const spinnerMock = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};

vi.mock('ora', () => ({
  default: vi.fn(() => spinnerMock),
}));

describe('TypeCheckerHost', () => {
  let typeCheckerHost: TypeCheckerHost;

  beforeEach(() => {
    typeCheckerHost = new TypeCheckerHost();
    vi.clearAllMocks();
    spinnerMock.start.mockClear();
    spinnerMock.succeed.mockClear();
    spinnerMock.fail.mockClear();
  });

  describe('run', () => {
    it('should throw when tsconfigPath is undefined', () => {
      expect(() => typeCheckerHost.run(undefined, {})).toThrow(
        '"tsconfigPath" is required when "tsProgramRef" is not provided.',
      );
    });

    it('should throw when tsconfigPath is an empty string', () => {
      expect(() => typeCheckerHost.run('', {})).toThrow(
        '"tsconfigPath" is required when "tsProgramRef" is not provided.',
      );
    });
  });

  describe('runOnce (via run)', () => {
    function setupMocks(diagnostics: ts.Diagnostic[]) {
      const mockProgram = {
        getSourceFiles: vi.fn().mockReturnValue([]),
        getCompilerOptions: vi.fn().mockReturnValue({}),
      } as unknown as ts.Program;

      const mockBuilderProgram = {
        getProgram: vi.fn().mockReturnValue(mockProgram),
      };

      const mockTsConfigProvider = {
        getByConfigFilename: vi.fn().mockReturnValue({
          options: {},
          fileNames: [],
          projectReferences: undefined,
        }),
      };

      const mockTsBinary = {
        ...ts,
        createIncrementalProgram: vi
          .fn()
          .mockReturnValue(mockBuilderProgram),
        getPreEmitDiagnostics: vi.fn().mockReturnValue(diagnostics),
        formatDiagnosticsWithColorAndContext: vi
          .fn()
          .mockReturnValue('mock formatted diagnostics'),
        sys: ts.sys,
      };

      const mockTypescriptLoader = {
        load: vi.fn().mockReturnValue(mockTsBinary),
      };

      Object.defineProperty(typeCheckerHost, 'tsConfigProvider', {
        value: mockTsConfigProvider,
        writable: true,
      });
      Object.defineProperty(typeCheckerHost, 'typescriptLoader', {
        value: mockTypescriptLoader,
        writable: true,
      });

      return { mockProgram, mockTsBinary };
    }

    it('should throw an error when type errors are found', () => {
      const mockDiagnostic: ts.Diagnostic = {
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: 'Type error mock',
        category: ts.DiagnosticCategory.Error,
        code: 2322,
      };

      setupMocks([mockDiagnostic]);

      const onTypeCheck = vi.fn();

      expect(() => {
        typeCheckerHost.run('tsconfig.json', {
          watch: false,
          onTypeCheck,
        });
      }).toThrow('Found 1 type error(s) during compilation.');

      // onTypeCheck should NOT be called when there are errors
      expect(onTypeCheck).not.toHaveBeenCalled();
    });

    it('should call onTypeCheck when there are no type errors', () => {
      const { mockProgram } = setupMocks([]);

      const onTypeCheck = vi.fn();

      expect(() => {
        typeCheckerHost.run('tsconfig.json', {
          watch: false,
          onTypeCheck,
        });
      }).not.toThrow();

      expect(onTypeCheck).toHaveBeenCalledTimes(1);
      expect(onTypeCheck).toHaveBeenCalledWith(mockProgram);
    });

    it('should not call process.exit when type errors are found', () => {
      const processExitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);

      const mockDiagnostic: ts.Diagnostic = {
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: 'Type error mock',
        category: ts.DiagnosticCategory.Error,
        code: 2322,
      };

      setupMocks([mockDiagnostic]);

      try {
        typeCheckerHost.run('tsconfig.json', {
          watch: false,
          onTypeCheck: vi.fn(),
        });
      } catch {
        // Expected to throw
      }

      expect(processExitSpy).not.toHaveBeenCalled();
      processExitSpy.mockRestore();
    });

    it('should include the number of errors in the thrown error message', () => {
      const diagnostics: ts.Diagnostic[] = [
        {
          file: undefined,
          start: undefined,
          length: undefined,
          messageText: 'Error 1',
          category: ts.DiagnosticCategory.Error,
          code: 2322,
        },
        {
          file: undefined,
          start: undefined,
          length: undefined,
          messageText: 'Error 2',
          category: ts.DiagnosticCategory.Error,
          code: 2345,
        },
        {
          file: undefined,
          start: undefined,
          length: undefined,
          messageText: 'Error 3',
          category: ts.DiagnosticCategory.Error,
          code: 2741,
        },
      ];

      setupMocks(diagnostics);

      expect(() => {
        typeCheckerHost.run('tsconfig.json', {
          watch: false,
          onTypeCheck: vi.fn(),
        });
      }).toThrow('Found 3 type error(s) during compilation.');
    });

    it('should call spinner.fail when type errors are thrown and not call spinner.succeed', () => {
      const mockDiagnostic: ts.Diagnostic = {
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: 'Type error mock',
        category: ts.DiagnosticCategory.Error,
        code: 2322,
      };

      setupMocks([mockDiagnostic]);

      try {
        typeCheckerHost.run('tsconfig.json', {
          watch: false,
          onTypeCheck: vi.fn(),
        });
      } catch {
        // Expected to throw
      }

      expect(spinnerMock.start).toHaveBeenCalledTimes(1);
      expect(spinnerMock.fail).toHaveBeenCalledTimes(1);
      expect(spinnerMock.succeed).not.toHaveBeenCalled();
    });

    it('should call spinner.succeed and not spinner.fail when no type errors are found', () => {
      setupMocks([]);

      typeCheckerHost.run('tsconfig.json', {
        watch: false,
        onTypeCheck: vi.fn(),
      });

      expect(spinnerMock.start).toHaveBeenCalledTimes(1);
      expect(spinnerMock.succeed).toHaveBeenCalledTimes(1);
      expect(spinnerMock.fail).not.toHaveBeenCalled();
    });
  });

  describe('runInWatchMode (via run)', () => {
    function setupWatchMocks() {
      const mockProgram = {
        getSourceFiles: vi.fn().mockReturnValue([]),
        getCompilerOptions: vi.fn().mockReturnValue({}),
      } as unknown as ts.Program;

      const mockBuilderProgram = {
        getProgram: vi.fn().mockReturnValue({
          getProgram: vi.fn().mockReturnValue(mockProgram),
        }),
      };

      let capturedReportWatchStatusCallback:
        | ((diagnostic: ts.Diagnostic) => void)
        | undefined;

      const mockTsConfigProvider = {
        getByConfigFilename: vi.fn().mockReturnValue({
          options: { strict: true },
          fileNames: [],
          projectReferences: undefined,
        }),
      };

      const createWatchCompilerHostMock = vi.fn(
        (
          _configPath: string,
          options: ts.CompilerOptions,
          _sys: any,
          _create: any,
          _reportDiagnostic: any,
          reportWatchStatusCallback: ts.WatchStatusReporter,
        ) => {
          capturedReportWatchStatusCallback = reportWatchStatusCallback;
          return { compilerOptions: options };
        },
      );

      const mockTsBinary = {
        ...ts,
        sys: ts.sys,
        createDiagnosticReporter: vi.fn().mockReturnValue(vi.fn()),
        createWatchCompilerHost: createWatchCompilerHostMock,
        createWatchProgram: vi.fn().mockReturnValue(mockBuilderProgram),
      };

      const mockTypescriptLoader = {
        load: vi.fn().mockReturnValue(mockTsBinary),
      };

      Object.defineProperty(typeCheckerHost, 'tsConfigProvider', {
        value: mockTsConfigProvider,
        writable: true,
      });
      Object.defineProperty(typeCheckerHost, 'typescriptLoader', {
        value: mockTypescriptLoader,
        writable: true,
      });

      return {
        mockProgram,
        mockTsBinary,
        createWatchCompilerHostMock,
        getReportWatchStatusCallback: () => capturedReportWatchStatusCallback!,
      };
    }

    it('should override compiler options with noEmit and preserveWatchOutput', () => {
      const { createWatchCompilerHostMock } = setupWatchMocks();

      typeCheckerHost.run('tsconfig.json', {
        watch: true,
        onTypeCheck: vi.fn(),
      });

      expect(createWatchCompilerHostMock).toHaveBeenCalledTimes(1);
      const optionsArg = createWatchCompilerHostMock.mock.calls[0][1];
      expect(optionsArg).toMatchObject({
        strict: true,
        preserveWatchOutput: true,
        noEmit: true,
      });
    });

    it('should call onTypeCheck with the program when "no errors" message is reported', () => {
      const { mockProgram, getReportWatchStatusCallback } = setupWatchMocks();

      const onTypeCheck = vi.fn();
      typeCheckerHost.run('tsconfig.json', {
        watch: true,
        onTypeCheck,
      });

      // Simulate watcher reporting a successful type check
      getReportWatchStatusCallback()({
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: TSC_NO_ERRORS_MESSAGE,
        category: ts.DiagnosticCategory.Message,
        code: 0,
      });

      expect(onTypeCheck).toHaveBeenCalledTimes(1);
      expect(onTypeCheck).toHaveBeenCalledWith(mockProgram);
    });

    it('should log to console.error when "Found N errors" message is reported', () => {
      const { getReportWatchStatusCallback } = setupWatchMocks();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const onTypeCheck = vi.fn();
      typeCheckerHost.run('tsconfig.json', {
        watch: true,
        onTypeCheck,
      });

      getReportWatchStatusCallback()({
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: 'Found 2 errors. Watching for file changes.',
        category: ts.DiagnosticCategory.Message,
        code: 0,
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][1]).toContain('Found 2 errors');
      expect(onTypeCheck).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not log or call onTypeCheck for unrelated watch status messages', () => {
      const { getReportWatchStatusCallback } = setupWatchMocks();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const onTypeCheck = vi.fn();
      typeCheckerHost.run('tsconfig.json', {
        watch: true,
        onTypeCheck,
      });

      getReportWatchStatusCallback()({
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: 'Starting compilation in watch mode...',
        category: ts.DiagnosticCategory.Message,
        code: 0,
      });

      expect(onTypeCheck).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should call onProgramInit on the next tick with the program', async () => {
      const { mockProgram } = setupWatchMocks();

      const onProgramInit = vi.fn();
      typeCheckerHost.run('tsconfig.json', {
        watch: true,
        onProgramInit,
      });

      // Not invoked synchronously — scheduled via process.nextTick
      expect(onProgramInit).not.toHaveBeenCalled();

      await new Promise<void>((resolve) => process.nextTick(resolve));

      expect(onProgramInit).toHaveBeenCalledTimes(1);
      expect(onProgramInit).toHaveBeenCalledWith(mockProgram);
    });

    it('should call spinner.succeed and not spinner.fail when watch setup completes', () => {
      setupWatchMocks();

      typeCheckerHost.run('tsconfig.json', {
        watch: true,
        onTypeCheck: vi.fn(),
      });

      expect(spinnerMock.start).toHaveBeenCalledTimes(1);
      expect(spinnerMock.succeed).toHaveBeenCalledTimes(1);
      expect(spinnerMock.fail).not.toHaveBeenCalled();
    });

    it('should call spinner.fail and rethrow when tsconfig parsing fails in watch mode', () => {
      setupWatchMocks();
      const parseError = new Error('Could not parse TypeScript config');
      Object.defineProperty(typeCheckerHost, 'tsConfigProvider', {
        value: {
          getByConfigFilename: vi.fn(() => {
            throw parseError;
          }),
        },
        writable: true,
      });

      expect(() => {
        typeCheckerHost.run('tsconfig.json', {
          watch: true,
          onTypeCheck: vi.fn(),
        });
      }).toThrow(parseError);

      expect(spinnerMock.start).toHaveBeenCalledTimes(1);
      expect(spinnerMock.fail).toHaveBeenCalledTimes(1);
      expect(spinnerMock.succeed).not.toHaveBeenCalled();
    });

    it('should call spinner.fail and rethrow when createWatchProgram throws in watch mode', () => {
      const { mockTsBinary } = setupWatchMocks();
      const watchError = new Error('createWatchProgram failed');
      mockTsBinary.createWatchProgram = vi.fn(() => {
        throw watchError;
      });

      expect(() => {
        typeCheckerHost.run('tsconfig.json', {
          watch: true,
          onTypeCheck: vi.fn(),
        });
      }).toThrow(watchError);

      expect(spinnerMock.start).toHaveBeenCalledTimes(1);
      expect(spinnerMock.fail).toHaveBeenCalledTimes(1);
      expect(spinnerMock.succeed).not.toHaveBeenCalled();
    });
  });
});
