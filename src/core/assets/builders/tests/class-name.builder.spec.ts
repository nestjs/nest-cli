import {expect} from 'chai';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {ClassNameBuilder} from '../class-name.builder';

describe('ClassNameBuilder', () => {
  let builder: ClassNameBuilder;
  beforeEach(() => {
    builder = new ClassNameBuilder();
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

  describe('#build()', () => {
    context('simple names', () => {
      it('should build a module class name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.MODULE)
            .build()
        ).to.be.equal('NameModule');
      });

      it('should build a controller class name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.CONTROLLER)
            .build()
        ).to.be.equal('NameController');
      });

      it('should builder a component class name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.COMPONENT)
            .build()
        ).to.be.equal('NameService');
      });

      it('should build a pipe class name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.PIPE)
            .build()
        ).to.be.equal('NamePipe');
      });

      it('should build a middleware class name', () => {
        expect(
          builder
            .addName('name')
            .addAsset(AssetEnum.MIDDLEWARE)
            .build()
        ).to.be.equal('NameMiddleware');
      });
    });

    context('snake case names', () => {
      it('should build a module class name', () => {
        expect(
          builder
            .addName('snake-name')
            .addAsset(AssetEnum.MODULE)
            .build()
        ).to.be.equal('SnakeNameModule');
      });
    });

    context('name from path', () => {
      it('should build a module class name', () => {
        expect(
          builder
            .addName('path/to/asset')
            .addAsset(AssetEnum.MODULE)
            .build()
        ).to.be.equal('AssetModule');
      });
    });
  });
});
