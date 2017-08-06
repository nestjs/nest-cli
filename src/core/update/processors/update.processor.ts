import {Processor} from '../../../common/asset/interfaces/processor.interface';
import {UpdateCommandArguments} from '../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../common/program/interfaces/command.options.interface';
import {Updater} from '../../../common/project/interfaces/updater.interface';
import {NestUpdater} from '../updaters/nest.updater';
import {PackageJsonUpdater} from '../updaters/package-json.updater';

export class UpdateProcessor implements Processor {
  constructor(
    private _nestUpdater: Updater = new NestUpdater(),
    private _packageJsonUpdater: Updater = new PackageJsonUpdater()
  ) {}

  public process(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public processV2(args: UpdateCommandArguments, options: UpdateCommandOptions): Promise<void> {
    return this._nestUpdater.update()
      .then(() => this._packageJsonUpdater.update());
  }

}
