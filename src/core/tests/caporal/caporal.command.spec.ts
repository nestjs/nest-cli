import {Command} from '../../../common/interfaces/command.interface';
import {CaporalCommand} from '../../caporal/caporal.command';
import * as sinon from 'sinon';
import {expect} from 'chai';
import * as caporal from 'caporal';

describe('CaporalCommand', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });

  let staticCaporalCommand;
  beforeEach(() => {
    staticCaporalCommand = caporal.command('name', 'description');
  });

  let command: Command;
  beforeEach(() => {
    command = new CaporalCommand(staticCaporalCommand);
  });

  describe('#alias()', () => {
    it('should call caporal.command.alias()', () => {
      const aliasStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'alias');
      command.alias('name');
      expect(aliasStub.calledWith('name')).to.be.true;
    });
  });

  describe('#argument()', () => {
    it('should call caporal.command.argument()', () => {
      const argumentStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'argument');
      command.argument('name', 'description');
      expect(argumentStub.calledWith('name', 'description')).to.be.true;
    });
  });

  describe('#option()', () => {
    it('should call caporal.command.option()', () => {
      const optionStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'option');
      command.option('name', 'description');
      expect(optionStub.calledWith('name', 'description')).to.be.true;
    });
  });

  describe('#option()', () => {
    it('should call caporal.command.action()', () => {
      const actionStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'action');
      command.handler();
      expect(actionStub.calledOnce).to.be.true;
    });
  });
});
