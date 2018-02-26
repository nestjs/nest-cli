import * as program from 'caporal';
import { GenerateCommand } from '../../../src/commands/generate/generate.command';

describe('Generate Command', () => {
  let command: GenerateCommand;
  beforeEach(() => command = new GenerateCommand());
  describe('#declare()', () => {
    it('can call declare()', () => {
      command.declare(program);
    });
  });
});