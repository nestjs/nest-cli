import {expect} from 'chai';
import {PathUtils} from '../../utils/path.utils';
import * as path from 'path';

describe('PathUtils', () => {
  it('should exist', () => {
    expect(PathUtils).to.exist;
  });

  describe('#relative()', () => {
    it('should return the relative path in the same directory', () => {
      const dirname = 'path/to/file';
      const origin: string = path.resolve(dirname, 'origin.ext');
      const destination: string = path.resolve(dirname, 'destination.ext');
      expect(PathUtils.relative(origin, destination)).to.be.equal('./destination.ext');
    });

    it('should return the relative path with origin in a parent directory', () => {
      const origin: string = path.resolve('path/to/file', 'origin.ext');
      const destination: string = path.resolve('path/to/file/sub-dir', 'destination.ext');
      expect(PathUtils.relative(origin, destination)).to.be.equal('./sub-dir/destination.ext');
    });
  });
});
