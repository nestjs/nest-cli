import { expect } from 'chai';
import { Template, TemplateReplacer, Token } from '../template.replacer';

describe('TemplateReplacer', () => {
  let replacer: TemplateReplacer;
  beforeEach(() => replacer = new TemplateReplacer());
  describe('#replace()', () => {
    it('can call replace()', () => {
      expect(replacer.replace).to.exist;
    });
    it('should return a copy of the template with the modified content', () => {
      const template: Template = {
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
        content: 'import {Module} from \'@nestjs/common\';\n' +
                 '\n' +
                 '@Module({})\n' +
                 'export class NameType {}\n'
      });
    });
  });
});
