import {CaporalProgram} from '../../caporal/caporal.program';
import * as sinon from 'sinon';
import * as caporal from 'caporal';
import {expect} from 'chai';
import {Program} from '../../../../common/program/interfaces/program.interface';

describe('CaporalProgram', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  let program: Program;
  beforeEach(() => {
    program  = new CaporalProgram();
  });

  describe('#version()', () => {
    it('should call caporal.version()', () => {
      const versionStub: sinon.SinonStub = sandbox.stub(caporal, 'version');
      program.version('version');
      expect(versionStub.calledWith('version')).to.be.true;
    });
  });

  describe('#help()', () => {
    it('should call caporal.help()', () => {
      const helpStub: sinon.SinonStub = sandbox.stub(caporal, 'help');
      program.help('content');
      expect(helpStub.calledWith('content')).to.be.true;
    });
  });

  describe('#declare()', () => {
    it('should call the declaration handler', () => {
      const handlerStub: sinon.SinonStub = sandbox.stub();
      program.declare(handlerStub);
      expect(handlerStub.called).to.be.true;
    });
  });

  describe('#command()', () => {
    it('should call caporal.command()', () => {
      const commandStub: sinon.SinonStub = sandbox.stub(caporal, 'command');
      program.command('name', 'description');
      expect(commandStub.calledWith('name', 'description')).to.be.true;
    });
  });

  describe('#listen()', () => {
    it('should call caporal.parse()', () => {
      const parseStub: sinon.SinonStub = sandbox.stub(caporal, 'parse');
      program.listen();
      expect(parseStub.calledWith(process.argv)).to.be.true;
    });
  });
});
