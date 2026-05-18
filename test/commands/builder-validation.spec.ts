import { BuildCommand } from '../../commands/build.command';
import { StartCommand } from '../../commands/start.command';

function createProgramMock() {
  let actionCallback: Function;
  const commandMock: any = {};
  Object.assign(commandMock, {
    allowUnknownOption: jest.fn(() => commandMock),
    option: jest.fn(() => commandMock),
    description: jest.fn(() => commandMock),
    action: jest.fn((callback: Function) => {
      actionCallback = callback;
      return commandMock;
    }),
  });
  const programMock = {
    command: jest.fn(() => commandMock),
    rawArgs: [],
    options: [],
  };

  return {
    programMock,
    commandMock,
    getAction: () => actionCallback!,
  };
}

describe('builder command validation', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('should accept "oxc" for nest build --builder', async () => {
    const action = { handle: jest.fn() };
    const { programMock, getAction } = createProgramMock();
    new BuildCommand(action as any).load(programMock as any);

    await getAction()([], {
      builder: 'oxc',
      watch: false,
      watchAssets: false,
      webpack: false,
      tsc: false,
      typeCheck: true,
      all: false,
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(action.handle).toHaveBeenCalledWith(
      [{ name: 'app', value: undefined }],
      expect.arrayContaining([
        { name: 'builder', value: 'oxc' },
        { name: 'typeCheck', value: true },
      ]),
    );
  });

  it('should list oxc as an available build builder when validation fails', async () => {
    const action = { handle: jest.fn() };
    const { programMock, getAction } = createProgramMock();
    new BuildCommand(action as any).load(programMock as any);

    await getAction()([], {
      builder: 'invalid',
      watch: false,
      watchAssets: false,
      webpack: false,
      tsc: false,
      all: false,
    });

    expect(action.handle).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Available builders: tsc, webpack, swc, oxc'),
    );
  });

  it('should accept "oxc" for nest start --builder', async () => {
    const action = { handle: jest.fn() };
    const { programMock, getAction } = createProgramMock();
    new StartCommand(action as any).load(programMock as any);

    await getAction()('api', {
      builder: 'oxc',
      watch: true,
      watchAssets: false,
      webpack: false,
      tsc: false,
      typeCheck: true,
      shell: true,
      envFile: [],
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(action.handle).toHaveBeenCalledWith(
      [{ name: 'app', value: 'api' }],
      expect.arrayContaining([
        { name: 'builder', value: 'oxc' },
        { name: 'typeCheck', value: true },
      ]),
      expect.any(Array),
    );
  });

  it('should list oxc as an available start builder when validation fails', async () => {
    const action = { handle: jest.fn() };
    const { programMock, getAction } = createProgramMock();
    new StartCommand(action as any).load(programMock as any);

    await getAction()('api', {
      builder: 'invalid',
      watch: false,
      watchAssets: false,
      webpack: false,
      tsc: false,
      shell: true,
      envFile: [],
    });

    expect(action.handle).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Available builders: tsc, webpack, swc, oxc'),
    );
  });
});
