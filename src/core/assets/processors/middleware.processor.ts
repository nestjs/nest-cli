import {Processor} from '../../../common/asset/interfaces/processor.interface';

export class MiddlewareProcessor implements Processor {
  constructor(
    private _assetName: string,
    private _moduleName: string,
    private _extension: string
  ) {}

  public process(): Promise<void> {
    throw new Error("Method not implemented.");
  }

}
