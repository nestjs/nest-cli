import { expect } from 'chai';

export class GenerateCommand {
  constructor() {}

  public init() {

  }
}

describe('Generate Command', () => {
  let command: GenerateCommand;
  beforeEach(() => command = new GenerateCommand());
  describe('#init()', () => {
    it('can call init()', () => {
      expect(command.init).to.exist;
    });
  });
});