import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {PipeProcessor} from '../pipe.processor';

describe('PipeProcessor', () => {
  const assetName: string = 'name';
  const extension: string = 'ts';
  let moduleName: string;

  it('can be created', () => {
    const processor: Processor = new PipeProcessor(assetName, moduleName, extension);
  });
});
