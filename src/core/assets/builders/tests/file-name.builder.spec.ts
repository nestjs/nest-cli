import {expect} from 'chai';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../file-name.builder';

describe('FileNameBuilder', () => {
  let builder: FileNameBuilder;
  beforeEach(() => {
    builder = new FileNameBuilder();
  });

  describe('#addName()', () => {
    it('can call addName()', () => {
      builder.addName('name');
    });
  });

  describe('#addAsset()', () => {
    it('can call addAsset()', () => {
      builder.addAsset(AssetEnum.MODULE);
    });
  });

  describe('#addTest()', () => {
    it('can call addTest()', () => {
      builder.addTest(false);
    });
  });

  describe('#addExtension()', () => {
    it('can call addExtension()', () => {
      builder.addExtension('ts');
    });
  });

  describe('#build()', () => {
    context('simple names', () => {
      it('should build a module file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.MODULE)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.module.ts');
      });

      it('should build a test module file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.MODULE)
            .addTest(true)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.module.spec.ts');
      });

      it('should build a controller file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.CONTROLLER)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.controller.ts');
      });

      it('should build a test controller file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.CONTROLLER)
            .addTest(true)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.controller.spec.ts');
      });

      it('should build a component file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.COMPONENT)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.service.ts');
      });

      it('should build a test component file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.COMPONENT)
            .addTest(true)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.service.spec.ts');
      });

      it('should build a pipe file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.PIPE)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.pipe.ts');
      });

      it('should builder a middleware file name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.MIDDLEWARE)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('name.middleware.ts');
      });
    });

    context('snake case names', () => {
      it('should build a module file name', () => {
        expect(
          builder
            .addName('snake-name')
            .addAsset(AssetEnum.MODULE)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('snake-name.module.ts');
      });
    });

    context('name from path', () => {
      it('should build a module file name', () => {
        expect(
          builder
            .addName('path/to/asset')
            .addAsset(AssetEnum.MODULE)
            .addTest(false)
            .addExtension('ts')
            .build()
        ).to.be.equal('asset.module.ts');
      });
    });
  });
});
