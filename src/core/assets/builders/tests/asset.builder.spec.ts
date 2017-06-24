import {AssetBuilder} from '../asset.builder';
import {expect} from 'chai';
import {Template} from '../../../../common/asset/interfaces/template.interface';
import {TemplateBuilder} from '../template.builder';

describe('AssetBuilder', () => {
  let builder: AssetBuilder;
  beforeEach(() => builder = new AssetBuilder());

  describe('#addFilename()', () => {
    it('should return the builder instance', () => {
      const filename: string = 'filename';
      expect(builder.addFilename(filename)).to.be.equal(builder);
    });
  });

  describe('#addClassName()', () => {
    it('should return the builder instance', () => {
      const className: string = 'className';
      expect(builder.addClassName(className)).to.be.equal(builder);
    });
  });

  describe('#addTemplate()', () => {
    it('should return the builder instance', () => {
      const template: Template = new TemplateBuilder().build();
      expect(builder.addTemplate(template)).to.be.equal(builder);
    });
  });

  describe('#build()', () => {
    const filename: string = 'filename';
    const className: string = 'className';
    const template: Template = new TemplateBuilder().build();
    it('should return the expected asset', () => {
      expect(
        builder
          .addFilename(filename)
          .addClassName(className)
          .addTemplate(template)
          .build()
      ).to.be.deep.equal({
        filename: filename,
        className: className,
        template: template
      });
    });
  });
});
