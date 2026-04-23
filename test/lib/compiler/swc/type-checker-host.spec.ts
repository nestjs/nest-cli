import * as ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TypeCheckerHost } from '../../../../lib/compiler/swc/type-checker-host.js';

vi.mock('ora', () => {
  const spinner = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  };
  return { default: vi.fn(() => spinner) };
});

describe('TypeCheckerHost', () => {
  let typeCheckerHost: TypeCheckerHost;

  beforeEach(() => {
    typeCheckerHost = new TypeCheckerHost();
    vi.clearAllMocks();
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
  });
});
