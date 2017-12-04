import * as path from 'path';
import { Template, TemplateId } from './template.replacer';
import { FileSystemUtils } from '../../utils/file-system.utils';

export class TemplateLoader {
  constructor() {}

  public async load(type: string, language: string): Promise<Template[]> {
    const templateFileNames: string[] = await FileSystemUtils.readdir(path.resolve(__dirname, `templates/${type}`));
    return templateFileNames
      .filter((filename) => filename.indexOf(language) !== -1)
      .reduce(async (templates, filename) =>
        templates.then(async (templates) => await this.addFileContent(type, filename, templates)),
        Promise.resolve([])
      );
  }

  private async addFileContent(type: string, filename: string, templates: Template[]): Promise<Template[]> {
    const content: string = await FileSystemUtils.readFile(path.resolve(__dirname, `templates/${type}`, filename));
    if (filename.indexOf('spec') === -1) {
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