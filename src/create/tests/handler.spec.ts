import { expect } from 'chai';
import { CreateHandler } from '../handler';

describe('CreateHandler', () => {
  it('can be created', () => {
    const handler: CreateHandler = new CreateHandler();
  });

  describe('#handle()', () => {
    it('can call handle()', () => {
      const handler: CreateHandler = new CreateHandler();
      expect(handler.handle).to.exist;
    });
  });
});
