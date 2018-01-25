import * as sinon from 'sinon';
import { InfoHandler } from '../handler';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../../../logger/logger.service';

describe('InfoHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: InfoHandler;
  beforeEach(() => handler = new InfoHandler());

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
    LoggerService.setLogger({
      debug: () => {},
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {}
    });
  });

  describe('#handle()', () => {
    it('should run the command handler', async () => {
      await handler.handle();
      sinon.assert.called(readFileStub);
    });
  });
});
