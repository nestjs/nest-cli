import * as sinon from 'sinon';
import * as fs from 'fs';
import {ModuleUpdater} from '../../../../common/asset/interfaces/module.updater.interface';
import {ComponentUpdater} from '../../module-updaters/component.updater';
import {ModuleFinderImpl} from '../../module-finders/module.finder';
import {expect} from 'chai';
import {BufferedReadable, BufferedWritable} from '../streams/test.utils';
import {FileSystemUtils} from '../../../utils/file-system.utils';
import {LoggerService} from '../../../logger/logger.service';

describe('ComponentUpdater', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  beforeEach(() => sandbox.stub(LoggerService, 'getLogger').callsFake(() => {
    return {
      info: () => {}
    };
  }));

  let updater: ModuleUpdater;
  beforeEach(() => updater = new ComponentUpdater());

  let reader: BufferedReadable;
  let intermediateWriter: BufferedWritable;
  let intermediateReader: BufferedReadable;
  let writer: BufferedWritable;
  beforeEach(() => {
    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
      '\n' +
      '@Module({})\n' +
      'export class AssetModule {}\n';
    reader = new BufferedReadable(Buffer.from(content));
    intermediateWriter = new BufferedWritable();
    intermediateReader = new BufferedReadable(Buffer.from(content));
    writer = new BufferedWritable();
  });

  let findFromStub: sinon.SinonStub;
  let createReadStreamStub: sinon.SinonStub;
  let createWriteStream: sinon.SinonStub;
  let rmStub: sinon.SinonStub;
  beforeEach(() => {
    findFromStub = sandbox.stub(ModuleFinderImpl.prototype, 'findFrom');
    createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(filename => {
      return /.lock/.test(filename) ? intermediateReader : reader;
    });
    createWriteStream = sandbox.stub(fs, 'createWriteStream').callsFake(filename => {
      return /.lock/.test(filename) ? intermediateWriter : writer;
    });
    rmStub = sandbox.stub(FileSystemUtils, 'rm').callsFake(() => Promise.resolve());
  });

  describe('#update()', () => {
    const filename: string = 'path/to/asset/asset.service.ts';
    const relativeModuleFilename: string = './asset.service.ts';
    const className: string = 'AssetService';
    const moduleFilename: string = 'path/to/asset/asset.module.ts';

    beforeEach(() => findFromStub.callsFake(() => Promise.resolve(moduleFilename)));

    it('should use the module finder to retrieve the nearest module path', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(findFromStub, filename);
        });
    });

    it('should read the module filename', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(createReadStreamStub, moduleFilename);
        });
    });

    it('should update the module filename content', () => {
      return updater.update(filename, className)
        .then(() => {
          expect(intermediateWriter.getBuffer().toString()).to.be.equal(
            'import {Module} from \'@nestjs/common\';\n' +
            `import {${ className }} from ${ relativeModuleFilename };\n` +
            '\n' +
            '@Module({\n' +
            '  components: [\n' +
            `    ${ className }\n` +
            '  ]\n' +
            '})\n' +
            'export class AssetModule {}\n'
          );
        });
    });

    it('should write the updated file content in a intermediate lock file', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(createWriteStream, `${ moduleFilename }.lock`);
        });
    });

    it('should read the updated intermediate module file when update write is end', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(createReadStreamStub, `${ moduleFilename }.lock`);
        });
    });

    it('should write the updated module filename', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(createWriteStream, moduleFilename);
        });
    });

    it('should delete the lock file when write is ended', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledOnce(rmStub);
        });
    })
  });
});
