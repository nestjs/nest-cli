import {Generator} from '../../../common/interfaces/generator.interface';
import {ControllerGenerator} from '../../generators/controller.generator';
import {expect} from 'chai';

describe('ControllerGenerator', () => {
  let generator: Generator;
  beforeEach(() => generator = new ControllerGenerator());

  describe('#generate()', () => {
    it('should throw an error', () => {
      expect(() => {

      }).to.throw;
    });
  });
});
