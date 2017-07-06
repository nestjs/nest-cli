import {CaporalProgram} from '../caporal.program';
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
      sinon.assert.calledWith(versionStub, 'version');
    });
  });

  describe('#help()', () => {
    it('should call caporal.help()', () => {
      const helpStub: sinon.SinonStub = sandbox.stub(caporal, 'help');
      program.help('content');
      sinon.assert.calledWith(helpStub, 'content');
    });
  });

  describe('#declare()', () => {
    it('should call the declaration handler', () => {
      const handlerStub: sinon.SinonStub = sandbox.stub();
      program.declare(handlerStub);
      sinon.assert.calledOnce(handlerStub);
    });
  });

  describe('#command()', () => {
    it('should call caporal.command()', () => {
      const commandStub: sinon.SinonStub = sandbox.stub(caporal, 'command');
      program.command('name', 'description');
      sinon.assert.calledWith(commandStub, 'name', 'description');
    });
  });

  describe('#listen()', () => {
    it('should call caporal.parse()', () => {
      const parseStub: sinon.SinonStub = sandbox.stub(caporal, 'parse');
      program.listen();
      sinon.assert.calledWith(parseStub, process.argv);
    });
  });
});
