import {Template} from './template.interface';

export interface Asset {
  filename: string
  className: string
  template?: Template
}
