import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {UpdateProcessor} from '../update.processor';
import {UpdateCommandArguments} from '../../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../../common/program/interfaces/command.options.interface';

describe('UpdateProcessor', () => {
  let processor: Processor;
  beforeEach(() => processor = new UpdateProcessor());

  describe('#processV2()', () => {
    const args: UpdateCommandArguments = {};
    const options: UpdateCommandOptions = {};
  });
});
