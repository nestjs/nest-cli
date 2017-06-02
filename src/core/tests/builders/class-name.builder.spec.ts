import {ClassNameBuilder} from '../../builders';
import {AssetEnum} from '../../../common/enums';
import {expect} from 'chai';

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
    });

    context.skip('snake case names', () => {
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
