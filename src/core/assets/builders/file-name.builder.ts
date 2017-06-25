import {AssetEnum} from '../../../common/asset/enums/asset.enum';

export class FileNameBuilder {
  private _name: string;
  private _asset: AssetEnum;
  private _isTest: boolean;
  private _extension: string;

  public addName(name: string): FileNameBuilder {
    this._name = name;
    return this;
  }

  public addAsset(asset: AssetEnum): FileNameBuilder {
    this._asset = asset;
    return this;
  }

  public addTest(isTest: boolean): FileNameBuilder {
    this._isTest = isTest;
    return this;
  }

  public addExtension(extension: string): FileNameBuilder {
    this._extension = extension;
    return this;
  }

  public build(): string {
    return `${ this.mapName() }.${ this.mapAsset() }${ this.mapTest() }.${ this._extension }`;
  }

  private mapTest(): string {
    return this._isTest ? '.spec' : '';
  }

  private mapAsset(): string {
    switch (this._asset) {
      case AssetEnum.MODULE:
        return 'module';
      case AssetEnum.CONTROLLER:
        return 'controller';
      case AssetEnum.COMPONENT:
        return 'service';
      case AssetEnum.MIDDLEWARE:
        return 'middleware';
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
}
