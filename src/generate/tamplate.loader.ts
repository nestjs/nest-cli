import { FileSystemUtils } from '../utils/file-system.utils';
import * as path from 'path';
import { Template } from './template.replacer';

export class TemplateLoader {
  constructor() {}

  public async load(template: string, language: string): Promise<Map<string, Template>> {
    const templateFileNames: string[] = await FileSystemUtils.readdir(path.resolve(__dirname, `templates/${template}`));
    return templateFileNames
      .filter((filename) => filename.indexOf(language))
      .reduce(async (contents, filename, index) =>
        contents.then(async (contents) => await this.addFileContent(template, filename, index, contents)),
        Promise.resolve(new Map<string, Template>())
      );
  }

  private async addFileContent(template: string, filename: string, index: number, temlates: Map<string, Template>): Promise<Map<string, Template>> {
    const content: string = await FileSystemUtils.readFile(path.resolve(__dirname, `templates/${template}`, filename));
    if (index === 0) {
      temlates.set('main', { content: content });
    } else {
      temlates.set('spec', { content: content });
    }
    return temlates;
  }
}