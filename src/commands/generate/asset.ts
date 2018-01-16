import { Template } from './template';

export interface Asset {
  type: string;
  name: string;
  template?: Template;
  className?: string;
  directory?: string;
  filename?: string;
}