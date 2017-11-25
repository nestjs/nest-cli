import { expect } from 'chai';
import { CreateHandler } from '../handler';

describe('CreateHandler', () => {
  let handler: CreateHandler;
  beforeEach(() => handler = new CreateHandler());
  describe('#handle()', () => {
    it('can call handle()', () => {
      expect(handler.handle).to.exist;
    });
  });
});
