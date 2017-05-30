import {StreamUtil} from '../../utils/stream.util';

describe('StreamUtil', () => {
  describe('#replace()', () => {
    it('can call replace()', () => {
      StreamUtil.replace('[NAME]', 'ClassName');
    });
  });
});
