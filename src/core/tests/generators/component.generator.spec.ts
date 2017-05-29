import {Generator} from '../../../common/interfaces/generator.interface';
import {ComponentGenerator} from '../../generators/component.generator';

describe('ComponentGenerator', () => {
  it('can be created', () => {
    const generator: Generator = new ComponentGenerator();
  });
});
