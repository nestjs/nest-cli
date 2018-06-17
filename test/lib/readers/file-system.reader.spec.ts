import { readdir } from 'fs';
import { Reader } from '../../../lib/readers';

export class FileSystemReader implements Reader {
  constructor(private readonly directory: string) {}
  public async list(): Promise<string[]> {
    return undefined;
  }
  public async read(name: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}

describe('File System Reader', () => {
  it('can be created', () => {
    const dir: string = process.cwd();
    const reader: Reader = new FileSystemReader(dir);
  });
  it('should use fs.readdir when list()', async () => {
    const dir: string = process.cwd();
    const reader: Reader = new FileSystemReader(dir);
    const filenames: string[] = await reader.list();
    expect(readdir).toHaveBeenCalled();
  });
});
