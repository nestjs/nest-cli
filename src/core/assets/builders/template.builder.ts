import {Template} from '../../../common/asset/interfaces/template.interface';
import {Replacer} from '../../../common/asset/interfaces/replacer.interface';

export class TemplateBuilder {
  private _filename: string;
  private _replacer: Replacer;

  public addFilename(filename: string): TemplateBuilder {
    this._filename = filename;
    return this;
  }

  public addReplacer(replacer: Replacer): TemplateBuilder {
    this._replacer = replacer;
    return this;
  }

  public build(): Template {
    return {
      filename: this._filename,
      replacer: this._replacer
    };
  }
}
