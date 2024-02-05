import * as fs from 'fs';
import { FileSystemReader, Reader } from '../../../lib/readers';

jest.mock('fs', () => ({
  readdirSync: jest.fn().mockResolvedValue([]),
  readFileSync: jest.fn().mockResolvedValue('content'),
}));

const dir: string = process.cwd();
const reader: Reader = new FileSystemReader(dir);

describe('File System Reader', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('should use fs.readdirSync when list (for performance reasons)', async () => {
    reader.list();
    expect(fs.readdirSync).toHaveBeenCalled();
  });
  it('should use fs.readFileSync when read (for performance reasons)', async () => {
    reader.read('filename');
    expect(fs.readFileSync).toHaveBeenCalled();
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
  });
});
