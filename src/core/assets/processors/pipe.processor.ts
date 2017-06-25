import {Processor} from '../../../common/asset/interfaces/processor.interface';

export class PipeProcessor implements Processor {
  constructor(
    private _assetName: string,
    private _moduleName: string,
    private _extension: string
  ) {}
  
  public process(): Promise<void> {
    return undefined;
  }

}
