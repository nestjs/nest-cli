import * as sinon from 'sinon';
import * as fs from 'fs';
import {ModuleUpdater} from '../../../common/interfaces/module.updater.interface';
import {ComponentUpdater} from '../../module-updaters/component.updater';
import {ModuleFinderImpl} from '../../module-finders/module.finder';
import {expect} from 'chai';
import {BufferedReadable, BufferedWritable} from '../streams/test.utils';

describe('ComponentUpdater', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let updater: ModuleUpdater;
  beforeEach(() => updater = new ComponentUpdater());

  let reader: BufferedReadable;
  let writer: BufferedWritable;
  beforeEach(() => {
    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
      '\n' +
      '@Module({})\n' +
      'export class AssetModule {}\n';
    reader = new BufferedReadable(Buffer.from(content));
    writer = new BufferedWritable()
  });

  let findFromStub: sinon.SinonStub;
  let createReadStreamStub: sinon.SinonStub;
  let createWriteStream: sinon.SinonStub;
  beforeEach(() => {
    findFromStub = sandbox.stub(ModuleFinderImpl.prototype, 'findFrom');
    createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => reader);
    createWriteStream = sandbox.stub(fs, 'createWriteStream').callsFake(() => writer);
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

    // TODO: develop a relative path resolver in PathUtils
    it.skip('should update the module filename content', done => {
      reader.on('end', () => {
        expect(writer.getBuffer().toString()).to.be.equal(
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
        done();
      });
      updater.update(filename, className);
    });

    it('should write the updated module filename', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(createWriteStream, moduleFilename);
        });
    });
  });
});
