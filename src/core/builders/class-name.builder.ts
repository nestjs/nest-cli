import {AssetEnum} from '../../common/enums/asset.enum';

export class ClassNameBuilder {
  private _name: string = null;
  private _asset: AssetEnum = null;

  constructor() {}

  public addName(name: string): ClassNameBuilder {
    this._name = name;
    return this;
  }

  public addAsset(asset: AssetEnum): ClassNameBuilder {
    this._asset = asset;
    return this;
  }

  public build(): string {
    return `${ this.capitalizeName() }${ this.mapAssetClassName()}`;
  }

  private capitalizeName() {
    return `${ this._name.charAt(0).toUpperCase() }${  this._name.slice(1, this._name.length )}`;
  }

  private mapAssetClassName(): string {
    switch(this._asset) {
      case AssetEnum.MODULE:
        return 'Module';
      case AssetEnum.CONTROLLER:
        return 'Controller';
      case AssetEnum.COMPONENT:
        return 'Service';
    }
  }
}
