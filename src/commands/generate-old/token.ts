export enum TokenName {
  CLASS_NAME = '__CLASS_NAME__',
  SPEC_IMPORT = '__SPEC_IMPORT__'
}

export interface Token {
  name: string;
  value: string;
}