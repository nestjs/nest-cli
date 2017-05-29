import {Generator} from '../../../common/interfaces/generator.interface';
import {ControllerGenerator} from '../../generators/controller.generator';

describe('ControllerGenerator', () => {
  it('can be created', () => {
    const generator: Generator = new ControllerGenerator();
  });
});
