import * as sinon from 'sinon';
import * as child_process from 'child_process';
import * as path from "path";
import { GenerateArguments, GenerateHandler } from '../../../src/commands/generate/generate.handler';

describe('Generate Handler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let execStub: sinon.SinonStub;
  beforeEach(() => execStub = sandbox.stub(child_process, 'exec')
    .callsFake((command, callback) => callback())
  );

  describe('#handle()', () => {
    it('should execute the right schematics command', async () => {
      const args: GenerateArguments = {
        type: 'type',
        name: 'name'
      };
      const handler = new GenerateHandler();
      await handler.handle(args);
      sandbox.assert.calledOnce(execStub);
      sandbox.assert.calledWith(
        execStub,
        path.join(__dirname, '../../..', 'node_modules/.bin/schematics')
          .concat(` ${ path.join(__dirname, '../../..') }:${ args.type }`)
          .concat(` --dry-run=false`)
          .concat(` --extension=ts`)
          .concat(` --name=${ args.name }`)
          .concat(` --path=${ args.name }`)
          .concat(' --rootDir=src/modules')
      );
      const something = {
        extension: 'ts',
        name: 'name',
        path: 'name',
        rootDir: 'src/modules'
      }
    });
  });
});