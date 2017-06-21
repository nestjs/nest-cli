import {TemplateBuilder} from '../template.builder';
import {expect} from 'chai';
import {Replacer} from '../../../../common/asset/interfaces/replacer.interface';

describe('TemplateBuilder', () => {
  let builder: TemplateBuilder;
  beforeEach(() => builder = new TemplateBuilder());

  describe('#addFilename()', () => {
    it('should return the builder instance', () => {
      const filename: string = 'filename';
      expect(builder.addFilename(filename)).to.be.equal(builder);
    });
  });

  describe('#addReplacer()', () => {
    it('should return the builder instance', () => {
      const replacer: Replacer = {};
      expect(builder.addReplacer(replacer)).to.be.equal(builder);
    });
  });

  describe('#build()', () => {
    it('should return the expected template', () => {
      const filename: string = 'filename';
      const replacer: Replacer = {};
      expect(
        builder
          .addFilename(filename)
          .addReplacer(replacer)
          .build()
      ).to.be.deep.equal({
        filename: filename,
        replacer: replacer
      });
    });
  });
});
