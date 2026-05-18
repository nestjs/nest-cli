import { BuildAction } from '../../actions/build.action';
import { OxcCompiler } from '../../lib/compiler/oxc/oxc-compiler';

jest.mock('../../lib/compiler/helpers/delete-out-dir', () => ({
  deleteOutDirIfEnabled: jest.fn(),
}));

jest.mock('../../lib/compiler/oxc/oxc-compiler', () => ({
  OxcCompiler: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
  })),
}));

describe('BuildAction', () => {
  let buildAction: BuildAction;
  let oxcRunMock: jest.Mock;

  const commandInputs = [{ name: 'app', value: undefined! }];
  const commandOptions = [
    { name: 'config', value: undefined! },
    { name: 'builder', value: 'oxc' },
    { name: 'typeCheck', value: true },
    { name: 'webpack', value: false },
    { name: 'all', value: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    oxcRunMock = jest.fn();
    (OxcCompiler as unknown as jest.Mock).mockImplementation(() => ({
      run: oxcRunMock,
    }));

    buildAction = new BuildAction();
    (buildAction as any).loader = {
      load: jest.fn().mockResolvedValue({
        sourceRoot: 'src',
        compilerOptions: {
          builder: 'oxc',
          typeCheck: true,
          assets: [],
        },
        projects: {},
      }),
    };
    (buildAction as any).tsConfigProvider = {
      getByConfigFilename: jest.fn(() => ({
        options: {
          outDir: 'dist',
          rootDir: 'src',
        },
      })),
    };
    (buildAction as any).assetsManager = {
      copyAssets: jest.fn(),
      closeWatchers: jest.fn(),
    };
  });

  it('should route builder "oxc" to OxcCompiler with type-check and assets extras', async () => {
    const onSuccess = jest.fn();

    await buildAction.runBuild(
      commandInputs,
      commandOptions,
      false,
      false,
      false,
      onSuccess,
    );

    expect(OxcCompiler).toHaveBeenCalledWith(
      (buildAction as any).pluginsLoader,
    );
    expect(oxcRunMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceRoot: 'src',
      }),
      'tsconfig.json',
      undefined,
      {
        watch: false,
        typeCheck: true,
        tsOptions: {
          outDir: 'dist',
          rootDir: 'src',
        },
        assetsManager: (buildAction as any).assetsManager,
      },
      onSuccess,
    );
  });

  it('should not warn that typeCheck is ignored for the OXC builder', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await buildAction.runBuild(commandInputs, commandOptions, false, false);

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('"typeCheck" will not have any effect'),
    );
    warnSpy.mockRestore();
  });
});
