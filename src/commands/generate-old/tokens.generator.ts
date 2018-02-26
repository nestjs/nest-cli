import { Token } from './token';
import { Asset } from './asset';
import { TokenName } from './tokens-name';

export class TokensGenerator {
  constructor() {}

  public generate(asset: Asset): Token[] {
    return [
      this.generateClassNameToken(asset),
      this.generateSpecImportToken(asset)
    ];
  }

  private generateClassNameToken(asset: Asset): Token {
    return {
      name: TokenName.CLASS_NAME,
      value: asset.className
    };
  }

  private generateSpecImportToken(asset: Asset): Token {
    return {
      name: TokenName.SPEC_IMPORT,
      value: `./${ asset.filename.replace('.spec', '').replace(/.(ts|js)/, '') }`
    };
  }
}