import {expect} from 'chai';
import {LoggerService} from '../logger.service';

describe('LoggerService', () => {
  describe('#setLogger()', () => {
    it('should return the set logger after setLogger() called', () => {
      LoggerService.setLogger(console);
      expect(LoggerService.getLogger()).to.be.deep.equal(console);
    });
  });

  describe('#getLogger()', () => {
    it('should return console logger if no logger is set', () => {
      expect(LoggerService.getLogger()).to.be.deep.equal(console);
    });
  });
});
