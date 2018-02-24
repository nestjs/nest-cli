import { NewCommand } from '../../../src/commands/new/new.command';

describe('NewCommand', () => {
  let command: NewCommand;
  beforeEach(() => command = new NewCommand());
  describe('#init()', () => {
    it('can call init()', () => {
      command.init({});
    });
  });
});
