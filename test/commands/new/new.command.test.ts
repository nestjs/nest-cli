import { NewCommand } from '../../../src/commands/new/new.command';
import * as program from 'caporal';

describe('New Command', () => {
  let command: NewCommand;
  beforeEach(() => command = new NewCommand());
  describe('#init()', () => {
    it('can call init()', () => {
      command.init(program);
    });
  });
});
