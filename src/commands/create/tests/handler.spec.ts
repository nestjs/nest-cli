import * as sinon from 'sinon';
import { CreateHandler } from '../handler';
import { GitRepository } from '../git.repository';
import { ConfigurationEmitter } from '../configuration.emitter';

describe('CreateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let cloneStub: sinon.SinonStub;
  let emitStub: sinon.SinonStub;
  beforeEach(() => {
    cloneStub = sandbox.stub(GitRepository.prototype, 'clone').callsFake(() => Promise.resolve());
    emitStub = sandbox.stub(ConfigurationEmitter.prototype, 'emit').callsFake(() => Promise.resolve());
  });

  let handler: CreateHandler;
  beforeEach(() => handler = new CreateHandler());

  describe('#handle()', () => {
    const args = {
      name: 'name'
    };
    it('should clone the default repository to name folder', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(cloneStub, 'https://github.com/nestjs/typescript-starter.git', args.name);
    });
    it('should clone the specified remote repository to name folder', async () => {
      const options= {
        repository: 'other_repository'
      };
      await handler.handle(args, options);
      sandbox.assert.calledWith(cloneStub, options.repository, args.name);
    });
    it('should emit the nest configuration file', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(emitStub, args.name);
    });
  });
});
