import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exitIfExtraArgs } from '../../../lib/utils/extra-args-warning.js';

function createCommandMock(name: string, args: string[]): Command {
  return {
    name: () => name,
    parent: {
      args,
    },
  } as unknown as Command;
}

describe('exitIfExtraArgs', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should not exit when argument count matches expected', () => {
    exitIfExtraArgs(
      createCommandMock('generate', ['resource', 'myName', 'myPath']),
      3,
    );

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should not exit when fewer arguments than expected are passed', () => {
    exitIfExtraArgs(createCommandMock('generate', ['resource']), 3);

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should exit with error when extra arguments are passed to generate', () => {
    exitIfExtraArgs(
      createCommandMock('generate', ['resource', 'aa', 'bb', 'cc', 'dd']),
      3,
    );

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Too many arguments'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('cc, dd'),
    );
  });

  it('should exit with error when extra arguments are passed to new', () => {
    exitIfExtraArgs(createCommandMock('new', ['a', 'b', 'c']), 1);

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Too many arguments'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('b, c'),
    );
  });

  it('should exit with error when extra arguments are passed to info', () => {
    exitIfExtraArgs(createCommandMock('info', ['extra']), 0);

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Too many arguments'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('extra'),
    );
  });

  it('should include command name in the help message', () => {
    exitIfExtraArgs(
      createCommandMock('generate', ['resource', 'aa', 'bb', 'extra']),
      3,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('nest generate --help'),
    );
  });
});
