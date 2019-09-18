import { extname } from 'path';

export function appendTsExtension(path: string): string {
  return extname(path) === '.ts' ? path : path + '.ts';
}
