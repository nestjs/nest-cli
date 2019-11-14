import * as fs from 'fs';
import { FileSystemReader, Reader } from '../../../lib/readers';

jest.mock('fs', () => {
  return {
    readdir: jest.fn((dir, callback) => callback(null, [])),
    readFile: jest.fn((filename, callback) => callback(null, 'content')),
  };
});

const dir: string = process.cwd();
const reader: Reader = new FileSystemReader(dir);

describe('File System Reader', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('should use fs.readdir when list', async () => {
    await reader.list();
    expect(fs.readdir).toHaveBeenCalled();
  });
  it('should use fs.readFile when read', async () => {
    await reader.read('filename');
    expect(fs.readFile).toHaveBeenCalled();
  });

  describe('readAnyOf tests', () => {
    it('should call readFile when running readAnyOf fn', async () => {
      const filenames: string[] = ['file1', 'file2', 'file3'];
      await reader.readAnyOf(filenames);

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should return null when no file is passed', async () => {
      const content = await reader.readAnyOf([]);
      expect(content).toEqual(undefined);
    });
  });
});
