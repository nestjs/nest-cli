import {expect} from 'chai';
import {ColorService} from '../color.service';

describe('ColorService', () => {
  it('should return a white string', () => {
    expect(ColorService.white('message')).to.be.equal(`\x1b[37m${ 'message' }\x1b[0m`);
  });

  it('should return a green string', () => {
    expect(ColorService.green('message')).to.be.equal(`\x1b[32m${ 'message' }\x1b[0m`);
  });

  it('should return a yellow string', () => {
    expect(ColorService.yellow('message')).to.be.equal(`\x1b[33m${ 'message' }\x1b[0m`);
  });

  it('should return a red string', () => {
    expect(ColorService.red('message')).to.be.equal(`\x1b[31m${ 'message' }\x1b[0m`);
  });
});
