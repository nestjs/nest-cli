import { expect } from 'chai';
import { ModuleMetadataParser } from '../module-metadata.parser';

describe('ModuleMetadataParser', () => {
  let parser: ModuleMetadataParser;
  beforeEach(() => parser = new ModuleMetadataParser());

  describe('#parse()', () => {
    it('should return an empty metadata object', () => {
      const content = '' +
        'import { Module } from \'@nestjs/common\';\n' +
        '\n' +
        '@Module({})\n' +
        'export class NameModule {}\n';
      expect(parser.parse(content)).to.be.deep.equal({});
    });
    it('should return metadata with controllers', () => {
      const content = '' +
        'import { Module } from \'@nestjs/common\';\n' +
        '\n' +
        '@Module({\n' +
        ' controllers: [\n' +
        '   NameController\n' +
        ' ]\n' +
        '})\n' +
        'export class NameModule {}\n';
      expect(parser.parse(content)).to.be.deep.equal({
        controllers: [
          'NameController'
        ]
      });
    });
  });
});
