import {Updater} from '../../../../common/project/interfaces/updater.interface';
import {NestUpdater} from '../nest.updater';
import * as sinon from 'sinon';
import {NpmUtils} from '../../../utils/npm.utils';

describe('NestUpdater', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let uninstallStub: sinon.SinonStub;
  let installStub: sinon.SinonStub;
  beforeEach(() => {
    uninstallStub = sandbox.stub(NpmUtils, 'uninstall').callsFake(() => Promise.resolve());
    installStub = sandbox.stub(NpmUtils, 'install').callsFake(() => Promise.resolve());
  });

  let updater: Updater;
  beforeEach(() => updater = new NestUpdater());

  describe('#update()', () => {
    it('should uninstall Nestjs dependencies', () => {
      return updater.update()
        .then(() => {
          sinon.assert.calledWith(uninstallStub, [
            '@nestjs/common',
            '@nestjs/core',
            '@nestjs/microservices',
            '@nestjs/testing',
            '@nestjs/websockets'
          ]);
        });
    });

    it('should install Nestjs dependencies', () => {
      return updater.update()
        .then(() => {
          sinon.assert.calledWith(installStub, [
            '@nestjs/common',
            '@nestjs/core',
            '@nestjs/microservices',
            '@nestjs/testing',
            '@nestjs/websockets'
          ]);
        });
    });
  });
});
