import { Input } from '../../commands';

export const parse = (name: string): (value: boolean | string) => Input => {
  return (value: boolean | string): Input => {
    return {
      name: name,
      value: value
    };
  };
};