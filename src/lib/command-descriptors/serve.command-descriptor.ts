import { CommandDescriptor } from '../../common/program/interfaces/command.descriptor.interface';
import { Command } from '../../common/program/interfaces/command.interface';
import { ServeCommandHandler } from '../handlers/serve-command.handler';


export class ServeCommandDescriptor implements CommandDescriptor {
    constructor(
        private _handler = new ServeCommandHandler()
    ) { }

    public describe(command: Command): void {
        command
            .alias('s')
            .handler(this._handler);
    }
}
