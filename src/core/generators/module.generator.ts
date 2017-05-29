import {Generator} from '../../common/interfaces/generator.interface';

export class ModuleGenerator implements Generator {
  public generate(name: string): Promise<void> {
    return Promise.resolve();
  }

}
