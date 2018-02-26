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
    it('should parse with empty metadata', () => {
      const content = '' +
        'import { AppController } from \'./app.controller\';\n' +
        'import { UsersModule } from \'./users.module\';\n' +
        '\n' +
        '@Module({\n' +
        '  imports: [],\n' +
        '  controllers: [AppController],\n' +
        '  components: []\n' +
        '})\n' +
        'export class ApplicationModule {}\n';
      expect(parser.parse(content)).to.be.deep.equal({
        imports: [],
        controllers: [
          'AppController'
        ],
        components: []
      });
    });
    it('should remove the last METADATA coma if it exist', () => {
      const content = '' +
        'import { AppController } from \'./app.controller\';\n' +
        'import { UsersModule } from \'./users.module\';\n' +
        '\n' +
        '@Module({\n' +
        '  imports: [],\n' +
        '  controllers: [AppController],\n' +
        '  components: [],\n' +
        '})\n' +
        'export class ApplicationModule {}\n';
      expect(parser.parse(content)).to.be.deep.equal({
        imports: [],
        controllers: [
          'AppController'
        ],
        components: []
      });
    });
  });
});
