import { Command } from 'commander';
import { exitIfExtraArgs } from '../../../lib/utils/extra-args-warning';

describe('exitIfExtraArgs', () => {
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should not exit when argument count matches expected', () => {
    const program = new Command();
    const sub = program.command('generate <schematic> [name] [path]');
    sub.action((schematic, name, path, cmd) => {
      exitIfExtraArgs(cmd, 3);
    });

    program.parse(['node', 'test', 'generate', 'resource', 'myName', 'myPath']);

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should not exit when fewer arguments than expected are passed', () => {
    const program = new Command();
    const sub = program.command('generate <schematic> [name] [path]');
    sub.action((schematic, name, path, cmd) => {
      exitIfExtraArgs(cmd, 3);
    });

    program.parse(['node', 'test', 'generate', 'resource']);

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should exit with error when extra arguments are passed to generate', () => {
    const program = new Command();
    const sub = program.command('generate <schematic> [name] [path]');
    sub.action((schematic, name, path, cmd) => {
      exitIfExtraArgs(cmd, 3);
    });

    program.parse([
      'node',
      'test',
      'generate',
      'resource',
      'aa',
      'bb',
      'cc',
      'dd',
    ]);

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Too many arguments'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('cc, dd'),
    );
  });

  it('should exit with error when extra arguments are passed to new', () => {
    const program = new Command();
    const sub = program.command('new [name]');
    sub.action((name, cmd) => {
      exitIfExtraArgs(cmd, 1);
    });

    program.parse(['node', 'test', 'new', 'a', 'b', 'c']);

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Too many arguments'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('b, c'),
    );
  });

  it('should exit with error when extra arguments are passed to info', () => {
    const program = new Command();
    const sub = program.command('info');
    sub.action((cmd) => {
      exitIfExtraArgs(cmd, 0);
    });

    program.parse(['node', 'test', 'info', 'extra']);

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Too many arguments'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('extra'),
    );
  });

  it('should include command name in the help message', () => {
    const program = new Command();
    const sub = program.command('generate <schematic> [name] [path]');
    sub.action((schematic, name, path, cmd) => {
      exitIfExtraArgs(cmd, 3);
    });

    program.parse([
      'node',
      'test',
      'generate',
      'resource',
      'aa',
      'bb',
      'extra',
    ]);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('nest generate --help'),
    );
  });
});
