import {Generator} from '../../common/interfaces/generator.interface';

export class ControllerGenerator implements Generator {
  public generate(name: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
