import {PackageJsonUpdater} from '../package-json.updater';
import * as sinon from 'sinon';
import {NpmUtils} from '../../../utils/npm.utils';
import {Updater} from '../../../../common/project/interfaces/updater.interface';
import {FileSystemUtils} from '../../../utils/file-system.utils';
import * as path from 'path';
import {LoggerService} from '../../../../logger/logger.service';

describe('PackageJsonUpdater', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let readFileStub: sinon.SinonStub;
  let uninstallStub: sinon.SinonStub;
  let installStub: sinon.SinonStub;
  beforeEach(() => {
    readFileStub = sandbox.stub(FileSystemUtils, 'readFile').callsFake(() => Promise.resolve(
      Buffer.from(JSON.stringify({
        "devDependencies": {
          "@types/chai": "^4.0.1",
          "@types/express": "^4.0.36",
          "@types/mocha": "^2.2.41",
          "@types/node": "^8.0.7",
          "@types/sinon": "^2.3.2",
          "chai": "^4.0.2",
          "mocha": "^3.4.2",
          "sinon": "^2.3.6",
          "ts-node": "^2.2.0",
          "typescript": "^2.3.1"
        }
      }))
    ));
    uninstallStub = sandbox.stub(NpmUtils, 'uninstall').callsFake(() => Promise.resolve());
    installStub = sandbox.stub(NpmUtils, 'install').callsFake(() => Promise.resolve());
    sandbox.stub(LoggerService, 'getLogger').callsFake(() => {
      return {
        info: () => {},
        debug: () => {}
      }
    });
  });

  let updater: Updater;
  beforeEach(() => updater = new PackageJsonUpdater());

  describe('#update()', () => {
    it('should read the package.json file', () => {
      return updater.update()
        .then(() => {
          sinon.assert.calledWith(readFileStub, path.join(process.cwd(), 'package.json'));
        });
    });

    it('should uninstall dev dependencies', () => {
      return updater.update()
        .then(() => {
          sinon.assert.calledWith(uninstallStub, '-dev', [
            '@types/chai',
            '@types/express',
            '@types/mocha',
            '@types/node',
            '@types/sinon',
            'chai',
            'mocha',
            'sinon',
            'ts-node',
            'typescript'
          ]);
        });
    });

    it('should install dev dependencies', () => {
      return updater.update()
        .then(() => {
          sinon.assert.calledWith(installStub, '-dev', [
            '@types/chai',
            '@types/express',
            '@types/mocha',
            '@types/node',
            '@types/sinon',
            'chai',
            'mocha',
            'sinon',
            'ts-node',
            'typescript'
          ]);
        });
    });
  });
});
