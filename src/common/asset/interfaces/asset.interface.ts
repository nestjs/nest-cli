import {Template} from './template.interface';
import {AssetEnum} from '../enums/asset.enum';

export interface Asset {
  type?: AssetEnum
  filename: string
  className: string
  template?: Template
}
