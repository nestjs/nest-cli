import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {GatewayProcessor} from '../gateway.processor';

describe('GatewayProcessor', () => {
  const assetName: string = 'name';
  const extension: string = 'ts';
  let moduleName: string;

  it('can be created', () => {
    const processor: Processor = new GatewayProcessor(assetName, moduleName, extension);
  });
});
