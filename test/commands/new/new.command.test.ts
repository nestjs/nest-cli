import { NewCommand } from '../../../src/commands/new/new.command';
import * as program from 'caporal';

describe('New Command', () => {
  let command: NewCommand;
  beforeEach(() => command = new NewCommand());
  describe('#declare()', () => {
    it('can call declare()', () => {
      command.declare(program);
    });
  });
});
