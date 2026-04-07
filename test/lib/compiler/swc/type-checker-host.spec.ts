import * as ts from 'typescript';
import { TypeCheckerHost } from '../../../../lib/compiler/swc/type-checker-host';

jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => spinner);
});

describe('TypeCheckerHost', () => {
  let typeCheckerHost: TypeCheckerHost;

  beforeEach(() => {
    typeCheckerHost = new TypeCheckerHost();
    jest.clearAllMocks();
  });

  describe('runOnce (via run)', () => {
    function setupMocks(diagnostics: ts.Diagnostic[]) {
      const mockProgram = {
        getSourceFiles: jest.fn().mockReturnValue([]),
        getCompilerOptions: jest.fn().mockReturnValue({}),
      } as unknown as ts.Program;

      const mockBuilderProgram = {
        getProgram: jest.fn().mockReturnValue(mockProgram),
      };

      const mockTsConfigProvider = {
        getByConfigFilename: jest.fn().mockReturnValue({
          options: {},
          fileNames: [],
          projectReferences: undefined,
        }),
      };

      const mockTsBinary = {
        ...ts,
        createIncrementalProgram: jest
          .fn()
          .mockReturnValue(mockBuilderProgram),
        getPreEmitDiagnostics: jest.fn().mockReturnValue(diagnostics),
        formatDiagnosticsWithColorAndContext: jest
          .fn()
          .mockReturnValue('mock formatted diagnostics'),
        sys: ts.sys,
      };

      const mockTypescriptLoader = {
        load: jest.fn().mockReturnValue(mockTsBinary),
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

      const onTypeCheck = jest.fn();

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

      const onTypeCheck = jest.fn();

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
      const processExitSpy = jest
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
          onTypeCheck: jest.fn(),
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
          onTypeCheck: jest.fn(),
        });
      }).toThrow('Found 3 type error(s) during compilation.');
    });
  });
});
