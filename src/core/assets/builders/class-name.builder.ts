import {AssetEnum} from '../../../common/asset/enums/asset.enum';

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
    return `${ this.capitalize(this.mapName()) }${ this.mapAsset()}`;
  }

  private mapAsset(): string {
    switch(this._asset) {
      case AssetEnum.MODULE:
        return 'Module';
      case AssetEnum.CONTROLLER:
        return 'Controller';
      case AssetEnum.COMPONENT:
        return 'Service';
    }
  }

  private mapName(): string {
    if (this.isPath()) {
      return this.mapNameFromPath();
    }
    return this._name;
  }

  private isPath(): boolean {
    return this._name.indexOf('/') !== -1;
  }

  private mapNameFromPath(): string {
    const elements: string[] = this._name.split('/');
    return elements[elements.length - 1];
  }

  private capitalize(name: string) {
    return `${ name.charAt(0).toUpperCase() }${  name.slice(1, name.length )}`;
  }
}
