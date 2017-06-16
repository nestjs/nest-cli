import {Replacer} from './replacer.interface';
import {Template} from './template.interface';

export interface Asset {
  filename: string
  className?: string
  template?: Template
  path?: string
  replacer?: Replacer
}
