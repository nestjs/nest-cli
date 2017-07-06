import {Processor} from '../../../common/asset/interfaces/processor.interface';
import {UpdateCommandArguments} from '../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../common/program/interfaces/command.options.interface';
import {Updater} from '../../../common/project/interfaces/updater.interface';
import {NestUpdater} from '../updaters/nest.updater';

export class UpdateProcessor implements Processor {
  constructor(
    private _updater: Updater = new NestUpdater()
  ) {}

  public process(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public processV2(args: UpdateCommandArguments, options: UpdateCommandOptions): Promise<void> {
    return this._updater.update();
  }

}
