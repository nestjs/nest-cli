import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {Template} from '../../../common/asset/interfaces/template.interface';

export class AssetBuilder {
  private _filename: string;
  private _className: string;
  private _template: Template;

  public addFilename(filename: string): AssetBuilder {
    this._filename = filename;
    return this;
  }

  public addClassName(className: string): AssetBuilder {
    this._className = className;
    return this;
  }

  public addTemplate(template: Template): AssetBuilder {
    this._template = template;
    return this;
  }

  public build(): Asset {
    return {
      filename: this._filename,
      className: this._className,
      template: this._template
    };
  }
}
