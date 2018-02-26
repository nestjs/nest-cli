import * as sinon from 'sinon';
import * as child_process from 'child_process';
import { NewArguments, NewHandler } from '../../../src/commands/new/new.handler';
import * as path from 'path';

describe('NewHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let execStub: sinon.SinonStub;
  beforeEach(() => execStub = sandbox.stub(child_process, 'exec')
    .callsFake((command, callback) => callback())
  );

  describe('#handle()', () => {
    it('should execute the right command', async () => {
      const args: NewArguments = {
        name: 'name'
      };
      const handler = new NewHandler();
      await handler.handle(args);
      sandbox.assert.calledOnce(execStub);
      sandbox.assert.calledWith(
        execStub,
        `${ path.join(__dirname, '../../..', 'node_modules/.bin/schematics') } ${ path.join(__dirname, '../../..') }:application --dry-run=false --path=${ args.name } --extension=ts`,
      );
    });
  });
});
