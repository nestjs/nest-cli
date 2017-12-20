import { expect } from 'chai';
import { TemplateReplacer} from '../template.replacer';
import { Template } from '../template';
import { Token } from '../token';

describe('TemplateReplacer', () => {
  let replacer: TemplateReplacer;
  beforeEach(() => replacer = new TemplateReplacer());
  describe('#replace()', () => {
    it('should return a copy of the template with the modified content', () => {
      const template: Template = {
        name: '',
        content: 'import {Module} from \'@nestjs/common\';\n' +
                 '\n' +
                 '@Module({})\n' +
                 'export class __CLASS_NAME__ {}\n'
      };
      const tokens: Token[] = [
        {
          name: '__CLASS_NAME__',
          value: 'NameType'
        }
      ];
      expect(replacer.replace(template, tokens)).to.be.deep.equal({
        name: '',
        content: 'import {Module} from \'@nestjs/common\';\n' +
                 '\n' +
                 '@Module({})\n' +
                 'export class NameType {}\n'
      });
    });
    it('should replace all tokens in a a single file', () => {
      const template: Template = {
        name: '',
        content: 'import {Test} from \'@nestjs/testing\';\n' +
        'import {TestingModule} from \'@nestjs/testing/testing-module\';\n' +
        'import {__CLASS_NAME__} from \'./__IMPORT__\';\n' +
        'import {expect} from \'chai\';\n' +
        '\n' +
        'describe(\'__CLASS_NAME__\', () => {\n' +
        '  let module: TestingModule;\n' +
        '  beforeEach(() => {\n' +
        '    return Test.createTestingModule({\n' +
        '      controllers: [\n' +
        '        __CLASS_NAME__\n' +
        '      ]\n' +
        '    }).compile()\n' +
        '      .then(compiledModule => module = compiledModule);\n' +
        '  });\n' +
        '\n' +
        '  let controller: __CLASS_NAME__;\n' +
        '  beforeEach(() => {\n' +
        '    controller = module.get(__CLASS_NAME__);\n' +
        '  });\n' +
        '\n' +
        '  it(\'should exist\', () => {\n' +
        '    expect(controller).to.exist;\n' +
        '  });\n' +
        '});\n'
      };
      const tokens: Token[] = [
        {
          name: '__CLASS_NAME__',
          value: 'NameType'
        }
      ];
      expect(replacer.replace(template, tokens)).to.be.deep.equal({
        name: '',
        content: 'import {Test} from \'@nestjs/testing\';\n' +
        'import {TestingModule} from \'@nestjs/testing/testing-module\';\n' +
        'import {NameType} from \'./__IMPORT__\';\n' +
        'import {expect} from \'chai\';\n' +
        '\n' +
        'describe(\'NameType\', () => {\n' +
        '  let module: TestingModule;\n' +
        '  beforeEach(() => {\n' +
        '    return Test.createTestingModule({\n' +
        '      controllers: [\n' +
        '        NameType\n' +
        '      ]\n' +
        '    }).compile()\n' +
        '      .then(compiledModule => module = compiledModule);\n' +
        '  });\n' +
        '\n' +
        '  let controller: NameType;\n' +
        '  beforeEach(() => {\n' +
        '    controller = module.get(NameType);\n' +
        '  });\n' +
        '\n' +
        '  it(\'should exist\', () => {\n' +
        '    expect(controller).to.exist;\n' +
        '  });\n' +
        '});\n'
      });
    });
  });
});
