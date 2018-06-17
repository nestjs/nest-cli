import * as fs from 'fs';
import { FileSystemReader, Reader } from '../../../lib/readers';

jest.mock('fs', () => {
  return {
    readdir: jest.fn((dir, callback) => callback(null, [])),
    readFile: jest.fn((filename, callback) => callback(null, 'content')),
  };
});

describe('File System Reader', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('should use fs.readdir when list', async () => {
    const dir: string = process.cwd();
    const reader: Reader = new FileSystemReader(dir);
    const filenames: string[] = await reader.list();
    expect(fs.readdir).toHaveBeenCalled();
  });
  it('should use fs.readFile when read', async () => {
    const dir: string = process.cwd();
    const reader: Reader = new FileSystemReader(dir);
    const content: string = await reader.read('filename');
    expect(fs.readFile).toHaveBeenCalled();
  });
});
