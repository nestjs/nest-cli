import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {UpdateProcessor} from '../update.processor';
import {UpdateCommandArguments} from '../../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../../common/program/interfaces/command.options.interface';
import * as sinon from 'sinon';
import {Updater} from '../../../../common/project/interfaces/updater.interface';
import {NestUpdater} from '../../updaters/nest.updater';
import {PackageJsonUpdater} from '../../updaters/package-json.updater';

describe('UpdateProcessor', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let nestUpdateStub: sinon.SinonStub;
  let packageJsonUpdateStub: sinon.SinonStub;
  let processor: Processor;
  beforeEach(() => {
    const nestUpdater: Updater = new NestUpdater();
    nestUpdateStub = sandbox.stub(nestUpdater, 'update').callsFake(() => Promise.resolve());

    const packageJsonUpdater: Updater = new PackageJsonUpdater();
    packageJsonUpdateStub = sandbox.stub(packageJsonUpdater, 'update').callsFake(() => Promise.resolve());

    processor = new UpdateProcessor(nestUpdater, packageJsonUpdater);
  });

  describe('#processV2()', () => {
    const args: UpdateCommandArguments = {};
    const options: UpdateCommandOptions = {};

    it('should update nest dependencies', () => {
      return processor.processV2(args, options)
        .then(() => {
          sinon.assert.calledOnce(nestUpdateStub);
        });
    });

    it('should update dev dependencies', () => {
      return processor.processV2(args, options)
        .then(() => {
          sinon.assert.calledOnce(packageJsonUpdateStub);
        });
    });
  });
});
