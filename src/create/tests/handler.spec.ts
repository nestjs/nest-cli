import * as sinon from 'sinon';
import { CreateHandler } from '../handler';
import { GitRepository } from '../git.repository';

describe('CreateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let cloneStub: sinon.SinonStub;
  beforeEach(() => cloneStub = sandbox.stub(GitRepository.prototype, 'clone').callsFake(() => Promise.resolve()));

  let handler: CreateHandler;
  beforeEach(() => handler = new CreateHandler());

  describe('#handle()', () => {
    it('should clone the default repository to name folder', async () => {
      const args = {
        name: 'name'
      };
      await handler.handle(args);
      sandbox.assert.calledWith(cloneStub, 'https://github.com/ThomRick/nest-typescript-starter.git', args.name);
    });
    it('should clone the specified remote repository to name folder', async () => {
      const args = {
        name: 'name'
      };
      const options= {
        repository: 'other_repository'
      };
      await handler.handle(args, options);
      sandbox.assert.calledWith(cloneStub, options.repository, args.name);
    });
  });
});
