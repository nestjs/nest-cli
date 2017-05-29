import {ModuleGenerator} from '../../generators/module.generator';
import {Generator} from '../../../common/interfaces/generator.interface';
import * as sinon from 'sinon';

describe('ModuleGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let generator: Generator;
  beforeEach(() => generator = new ModuleGenerator());

  describe('#generate()', () => {
    it('should return a Promise', done => {
      generator.generate('moduleName')
        .then(done);
    });

    it.skip('should create a folder with the given name', () => {

    });
  });
});
