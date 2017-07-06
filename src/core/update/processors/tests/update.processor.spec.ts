import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {UpdateProcessor} from '../update.processor';
import {UpdateCommandArguments} from '../../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../../common/program/interfaces/command.options.interface';
import * as sinon from 'sinon';
import {Updater} from '../../../../common/project/interfaces/updater.interface';
import {NestUpdater} from '../../updaters/nest.updater';

describe('UpdateProcessor', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  let updateStub: sinon.SinonStub;
  beforeEach(() => {
    const updater: Updater = new NestUpdater();
    updateStub = sandbox.stub(updater, 'update').callsFake(() => Promise.resolve());
    processor = new UpdateProcessor(updater);
  });

  describe('#processV2()', () => {
    const args: UpdateCommandArguments = {};
    const options: UpdateCommandOptions = {};

    it('should update package.json dependencies', () => {
      return processor.processV2(args, options)
        .then(() => {
          sinon.assert.calledOnce(updateStub);
        });
    });
  });
});
