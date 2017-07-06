import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {UpdateCommandHandler} from '../update-command.handler';

describe('UpdateCommandHandler', () => {
  it('can be created', () => {
    const handler: CommandHandler = new UpdateCommandHandler();
  });
});
