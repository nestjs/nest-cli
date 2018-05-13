import { parse } from '../../../lib/inputs/parse';

describe('Input Parse', () => {
  it('should return a Input with name and value', () => {
    const name = 'name';
    const value = 'value';
    const input = parse(name)(value);
  });
});