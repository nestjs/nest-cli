import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {Template} from '../../../common/asset/interfaces/template.interface';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';

export class AssetBuilder {
  private _type: AssetEnum;
  private _filename: string;
  private _className: string;
  private _template: Template;

  public addType(type: AssetEnum): AssetBuilder {
    this._type = type;
    return this;
  }

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
      type: this._type,
      filename: this._filename,
      className: this._className,
      template: this._template
    };
  }
}
