import {NestCliApplication} from '../nest-cli.application';
import {expect} from 'chai';

describe('NestCliApplication', () => {
  it('can be created', () => {
    expect(new NestCliApplication()).to.exist;
  });
});
