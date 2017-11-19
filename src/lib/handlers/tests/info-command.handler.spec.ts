import * as sinon from 'sinon';
import * as fs from 'fs';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {InfoCommandHandler} from '../info-command.handler';
import * as path from 'path';


describe('InfoCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => handler = new InfoCommandHandler());

  let readFileStub: sinon.SinonStub;
  beforeEach(() => {
    readFileStub = sandbox.stub(fs, 'readFile').callsFake((filename, encoding, callback) => {
      if (filename === path.join(process.cwd(), 'node_modules/@nestjs/core/package.json')) {
        callback(undefined, JSON.stringify({ version: 'version' }));
      } else if (filename === path.resolve('./package.json')) {
        callback(undefined, JSON.stringify({ version: 'version' }));
      } else {
        callback(new Error('Should not be there'));
      }
    });
  });

  describe('#execute()', () => {
    it('should run the command handler', async () => {
      await handler.execute({}, {}, console);
      sinon.assert.called(readFileStub);
    });
  });
});
