import { FileSystemUtils } from '../core/utils/file-system.utils';
import * as path from 'path';

export interface Templates {
  main: string;
  spec?: string;
}

export class TemplateLoader {
  constructor() {}

  public async load(template: string, language: string): Promise<Templates> {
    const templateFileNames: string[] = await FileSystemUtils.readdir(path.resolve(__dirname, `templates/${template}`));
    return templateFileNames
      .filter((filename) => filename.indexOf(language))
      .reduce(async (contents, filename, index) =>
        contents.then(async (contents) => await this.addFileContent(template, filename, index, contents)),
        Promise.resolve(<any> {})
      );
  }

  private async addFileContent(template: string, filename: string, index: number, contents: any) {
    const content: string = await FileSystemUtils.readFile(path.resolve(__dirname, `templates/${template}`, filename));
    if (index === 0) {
      contents.main = content;
    } else {
      contents.spec = content;
    }
    return contents;
  }
}