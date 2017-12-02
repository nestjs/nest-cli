import { FileSystemUtils } from '../utils/file-system.utils';
import * as path from 'path';
import { Template, TemplateId } from './template.replacer';

export class TemplateLoader {
  constructor() {}

  public async load(type: string, language: string): Promise<Template[]> {
    const templateFileNames: string[] = await FileSystemUtils.readdir(path.resolve(__dirname, `templates/${type}`));
    return templateFileNames
      .filter((filename) => filename.indexOf(language))
      .reduce(async (templates, filename, index) =>
        templates.then(async (templates) => await this.addFileContent(type, filename, index, templates)),
        Promise.resolve([])
      );
  }

  private async addFileContent(type: string, filename: string, index: number, templates: Template[]): Promise<Template[]> {
    const content: string = await FileSystemUtils.readFile(path.resolve(__dirname, `templates/${type}`, filename));
    if (index === 0) {
      templates.push({
        id: TemplateId.MAIN,
        content: content
      });
    } else {
      templates.push({
        id: TemplateId.SPEC,
        content: content
      });
    }
    return templates;
  }
}