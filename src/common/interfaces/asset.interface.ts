import {Replacer} from './replacer.interface';

export interface Asset {
  path: string
  filename: string
  replacer: Replacer
}
