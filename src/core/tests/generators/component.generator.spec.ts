import {Generator} from '../../../common/interfaces/generator.interface';
import {ComponentGenerator} from '../../generators/component.generator';
import {expect} from 'chai';

describe('ComponentGenerator', () => {
  let generator: Generator;
  beforeEach(() => generator = new ComponentGenerator());

  describe('#generate()', () => {
    it('should throw an error', () => {
      expect(() => {
        generator.generate('name');
      }).to.throw;
    })
  });
});
