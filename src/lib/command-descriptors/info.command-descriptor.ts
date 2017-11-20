import { CommandDescriptor } from '../../common/program/interfaces/command.descriptor.interface';
import { Command } from '../../common/program/interfaces/command.interface';
import { InfoCommandHandler } from '../handlers/info-command.handler';


export class InfoCommandDescriptor implements CommandDescriptor {
    constructor(
        private _handler = new InfoCommandHandler()
    ) { }

    public describe(command: Command): void {
        command
            .alias('i')
            .handler(this._handler);
    }
}
