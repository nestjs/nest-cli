import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FileSystemReader, Reader } from '../../../lib/readers/index.js';
import { ReaderFileLackPermissionsError } from '../../../lib/readers/reader.js';

vi.mock('fs', () => ({
  readdirSync: vi.fn().mockReturnValue([]),
  readFileSync: vi.fn().mockReturnValue('content'),
}));

const dir: string = process.cwd();
const reader: Reader = new FileSystemReader(dir);

interface FsCodeError extends Error {
  code: string;
  path?: string;
}

function createFsError(code: string, filePath?: string): FsCodeError {
  const err = new Error(code) as FsCodeError;
  err.code = code;
  if (filePath !== undefined) {
    err.path = filePath;
  }
  return err;
}

describe('File System Reader', () => {
  beforeEach(() => {
    vi.mocked(fs.readdirSync).mockReset().mockReturnValue([]);
    vi.mocked(fs.readFileSync).mockReset().mockReturnValue('content');
  });

  it('should use fs.readdirSync when list (for performance reasons)', async () => {
    reader.list();
    expect(fs.readdirSync).toHaveBeenCalled();
  });

  it('should pass the configured directory to fs.readdirSync', () => {
    reader.list();
    expect(fs.readdirSync).toHaveBeenCalledWith(dir);
  });

  it('should use fs.readFileSync when read (for performance reasons)', async () => {
    reader.read('filename');
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  it('should join directory with filename when reading', () => {
    reader.read('nest-cli.json');
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(dir, 'nest-cli.json'),
      'utf8',
    );
  });

  describe('readAnyOf tests', () => {
    it('should call readFileSync when running readAnyOf fn', async () => {
      const filenames: string[] = ['file1', 'file2', 'file3'];
      reader.readAnyOf(filenames);

      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should return undefined when no file is passed', async () => {
      const content = reader.readAnyOf([]);
      expect(content).toEqual(undefined);
    });

    it('should return content of the first file that exists', () => {
      vi.mocked(fs.readFileSync).mockReturnValueOnce('first-file-content');

      const content = reader.readAnyOf(['nest-cli.json', '.nest-cli.json']);

      expect(content).toBe('first-file-content');
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should fall through to next file when ENOENT is thrown', () => {
      vi.mocked(fs.readFileSync)
        .mockImplementationOnce(() => {
          throw createFsError('ENOENT');
        })
        .mockReturnValueOnce('second-file-content');

      const content = reader.readAnyOf(['nest-cli.json', '.nest-cli.json']);

      expect(content).toBe('second-file-content');
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    });

    it('should return undefined when all files throw non-permission errors', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw createFsError('ENOENT');
      });

      const content = reader.readAnyOf(['missing1', 'missing2']);

      expect(content).toBeUndefined();
    });

    it('should return ReaderFileLackPermissionsError when EACCES is the only failure', () => {
      const blockedPath = path.join(dir, 'nest-cli.json');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw createFsError('EACCES', blockedPath);
      });

      const content = reader.readAnyOf(['nest-cli.json']);

      expect(content).toBeInstanceOf(ReaderFileLackPermissionsError);
      const err = content as ReaderFileLackPermissionsError;
      expect(err.filePath).toBe(blockedPath);
      expect(err.fsErrorCode).toBe('EACCES');
    });

    it('should return ReaderFileLackPermissionsError when EPERM is the only failure', () => {
      const blockedPath = path.join(dir, '.nest-cli.json');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw createFsError('EPERM', blockedPath);
      });

      const content = reader.readAnyOf(['.nest-cli.json']);

      expect(content).toBeInstanceOf(ReaderFileLackPermissionsError);
      const err = content as ReaderFileLackPermissionsError;
      expect(err.filePath).toBe(blockedPath);
      expect(err.fsErrorCode).toBe('EPERM');
    });

    it('should preserve the first permission-error path even if a later file is missing', () => {
      const blockedPath = path.join(dir, 'nest-cli.json');
      vi.mocked(fs.readFileSync)
        .mockImplementationOnce(() => {
          throw createFsError('EACCES', blockedPath);
        })
        .mockImplementationOnce(() => {
          throw createFsError('ENOENT');
        });

      const content = reader.readAnyOf(['nest-cli.json', '.nest-cli.json']);

      expect(content).toBeInstanceOf(ReaderFileLackPermissionsError);
      const err = content as ReaderFileLackPermissionsError;
      // The error must point at the EACCES file we encountered first,
      // not at the ENOENT file processed last.
      expect(err.filePath).toBe(blockedPath);
    });

    it('should not record subsequent permission errors after the first one', () => {
      const firstBlocked = path.join(dir, 'nest-cli.json');
      const secondBlocked = path.join(dir, '.nest-cli.json');
      vi.mocked(fs.readFileSync)
        .mockImplementationOnce(() => {
          throw createFsError('EACCES', firstBlocked);
        })
        .mockImplementationOnce(() => {
          throw createFsError('EPERM', secondBlocked);
        });

      const content = reader.readAnyOf(['nest-cli.json', '.nest-cli.json']);

      expect(content).toBeInstanceOf(ReaderFileLackPermissionsError);
      const err = content as ReaderFileLackPermissionsError;
      expect(err.filePath).toBe(firstBlocked);
      // Code is taken from the *last* error in the loop, but path must
      // remain the *first* permission-blocked file.
      expect(err.fsErrorCode).toBe('EPERM');
    });

    it('should return content of a later file even if an earlier one was permission-blocked', () => {
      const blockedPath = path.join(dir, 'nest-cli.json');
      vi.mocked(fs.readFileSync)
        .mockImplementationOnce(() => {
          throw createFsError('EACCES', blockedPath);
        })
        .mockReturnValueOnce('fallback-content');

      const content = reader.readAnyOf(['nest-cli.json', '.nest-cli.json']);

      expect(content).toBe('fallback-content');
    });

    it('should ignore errors that do not have a string code property', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        // Throw a plain Error with no `code` field at all.
        throw new Error('weird');
      });

      const content = reader.readAnyOf(['nest-cli.json']);

      // No permission marker recorded => undefined, never an error instance.
      expect(content).toBeUndefined();
    });
  });
});

describe('ReaderFileLackPermissionsError', () => {
  it('should be an Error instance', () => {
    const err = new ReaderFileLackPermissionsError('/tmp/x', 'EACCES');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ReaderFileLackPermissionsError);
  });

  it('should expose filePath and fsErrorCode on the instance', () => {
    const err = new ReaderFileLackPermissionsError('/tmp/x', 'EPERM');
    expect(err.filePath).toBe('/tmp/x');
    expect(err.fsErrorCode).toBe('EPERM');
  });

  it('should embed the file path in the human-readable message', () => {
    const err = new ReaderFileLackPermissionsError(
      '/var/log/secret.json',
      'EACCES',
    );
    expect(err.message).toBe(
      'File /var/log/secret.json lacks read permissions!',
    );
  });
});
