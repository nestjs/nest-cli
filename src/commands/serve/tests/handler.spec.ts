import * as sinon from 'sinon';
import { ServeHandler } from '../handler';
import { NodemonAdapter } from '../nodemon.adapter';
import * as path from 'path';
import { ConfigurationLoader } from '../../../configuration/configuration.loader';
import { LoggerService } from '../../../logger/logger.service';

describe('ServeHandler', () => {
  let handler: ServeHandler;
  beforeEach(() => handler = new ServeHandler());

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let getPropertyStub: sinon.SinonStub;
  let startStub: sinon.SinonStub;
  beforeEach(() => {
    getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty')
      .callsFake((propertyName) => {
        if (propertyName === 'language') {
          return 'ts';
        } else if (propertyName === 'entryFile') {
          return 'src/server.ts'
        }
      });
    startStub = sandbox.stub(NodemonAdapter, 'start');
    LoggerService.setLogger({
      debug: () => {},
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {}
    });
  });

  describe('#handle()', () => {
    it('should get the language property from configuration', () => {
      handler.handle();
      sandbox.assert.calledWith(getPropertyStub, 'language');
    });
    it('should get the entryFile property from configuration', () => {
      handler.handle();
      sandbox.assert.calledWith(getPropertyStub, 'entryFile');
    });
    it('should call nodemon with the right parameters for js language', () => {
      getPropertyStub.callsFake((propertyName) => {
        if (propertyName === 'language') {
          return 'js';
        } else if (propertyName === 'entryFile') {
          return 'src/server.js'
        }
      });
      handler.handle();
      sandbox.assert.calledWith(startStub, {
        'watch': [ 'src/**/*.js' ],
        'ignore': [ 'src/**/*.spec.js' ],
        'exec': `node ${ path.resolve(process.cwd(), 'src/server.js') }`
      });
    });
    it('should call nodemon with the right parameters for ts language', () => {
      handler.handle();
      sandbox.assert.calledWith(startStub, {
        'watch': [ 'src/**/*.ts' ],
        'ignore': [ 'src/**/*.spec.ts' ],
        'exec': `./node_modules/.bin/ts-node ${ path.resolve(process.cwd(), 'src/server.ts') }`
      });
    });
  });
});
