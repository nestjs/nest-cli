import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {MiddlewareProcessor} from '../middleware.processor';

describe('MiddlewareProcessor', () => {
  const assetName: string = 'name';
  const extension: string = 'ts';
  let moduleName: string;

  it('can be created', () => {
    const porcessor: Processor = new MiddlewareProcessor(assetName, extension, moduleName);
  });
});
