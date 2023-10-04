import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader';
import { SwcCompiler } from '../../../../lib/compiler/swc/swc-compiler';

import * as swcDefaults from '../../../../lib/compiler/defaults/swc-defaults';
import * as getValueOrDefault from '../../../../lib/compiler/helpers/get-value-or-default';

describe('SWC Compiler', () => {
  let compiler: SwcCompiler;
  let swcDefaultsFactoryMock = jest.fn();
  let getValueOrDefaultMock = jest.fn();
  let debounceMock = jest.fn();

  const callRunCompiler = async ({
    configuration,
    tsconfig,
    appName,
    extras,
    onSuccess,
  }: any) => {
    return await compiler.run(
      configuration || {},
      tsconfig || '',
      appName || '',
      extras || {},
      onSuccess ?? jest.fn(),
    );
  };

  beforeEach(() => {
    const PluginsLoaderStub = {
      load: () => jest.fn(),
      resolvePluginReferences: () => jest.fn(),
    } as unknown as PluginsLoader;

    compiler = new SwcCompiler(PluginsLoaderStub);

    (swcDefaults as any).swcDefaultsFactory = swcDefaultsFactoryMock;
    (getValueOrDefault as any).getValueOrDefault = getValueOrDefaultMock;

    compiler['runSwc'] = jest.fn();
    compiler['runTypeChecker'] = jest.fn();
    compiler['debounce'] = debounceMock;
    compiler['watchFilesInOutDir'] = jest.fn();

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('should call swcDefaultsFactory with tsOptions and configuration', async () => {
      const fixture = {
        extras: {
          tsOptions: {
            _tsOptionsTest: {},
          },
        },
        configuration: {
          _configurationTest: {},
        },
      };

      await callRunCompiler({
        configuration: fixture.configuration,
        extras: fixture.extras,
      });
      expect(swcDefaultsFactoryMock).toHaveBeenCalledWith(
        fixture.extras.tsOptions,
        fixture.configuration,
      );
    });

    it('should call getValueOrDefault with configuration, swcrcPath and appName', async () => {
      const fixture = {
        configuration: '_configurationTest',
        appName: 'appNameTest',
      };

      await callRunCompiler({
        configuration: fixture.configuration,
        appName: fixture.appName,
      });

      expect(getValueOrDefaultMock).toHaveBeenCalledWith(
        fixture.configuration,
        'compilerOptions.builder.options.swcrcPath',
        fixture.appName,
      );
    });

    it('should not call runTypeChecker when extras.typeCheck is false', async () => {
      const fixture = {
        extras: {
          watch: false,
          typeCheck: false,
          tsOptions: null,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        extras: fixture.extras,
      });

      fixture.extras.watch = false;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runTypeChecker']).not.toHaveBeenCalled();
    });

    it('should call runTypeChecker when extras.typeCheck is true', async () => {
      const fixture = {
        configuration: '_configurationTest',
        tsConfigPath: 'tsConfigPathTest',
        appName: 'appNameTest',
        extras: {
          watch: false,
          typeCheck: true,
          tsOptions: null,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        configuration: fixture.configuration,
        extras: fixture.extras,
        appName: fixture.appName,
        tsconfig: fixture.tsConfigPath,
      });

      fixture.extras.watch = false;
      await callRunCompiler({
        configuration: fixture.configuration,
        extras: fixture.extras,
        appName: fixture.appName,
        tsconfig: fixture.tsConfigPath,
      });

      expect(compiler['runTypeChecker']).toHaveBeenCalledTimes(2);
      expect(compiler['runTypeChecker']).toHaveBeenCalledWith(
        fixture.configuration,
        fixture.tsConfigPath,
        fixture.appName,
        fixture.extras,
      );
    });

    it('should call runSwc', async () => {
      swcDefaultsFactoryMock.mockReturnValueOnce('swcOptionsTest');
      getValueOrDefaultMock.mockReturnValueOnce('swcrcPathTest');

      const fixture = {
        extras: {
          watch: false,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runSwc']).toHaveBeenCalledWith(
        'swcOptionsTest',
        fixture.extras,
        'swcrcPathTest',
      );

      fixture.extras.watch = false;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runSwc']).toHaveBeenCalledWith(
        'swcOptionsTest',
        fixture.extras,
        'swcrcPathTest',
      );
    });

    it('should not call onSuccess method when is not defined', async () => {
      expect(async () => {
        await callRunCompiler({});
      }).not.toThrow();
    });

    it('should call onSuccess method when is defined', async () => {
      const onSuccessMock = jest.fn();
      await callRunCompiler({
        onSuccess: onSuccessMock,
        extras: {
          watch: false,
        },
      });

      await callRunCompiler({
        onSuccess: onSuccessMock,
        extras: {
          watch: true,
        },
      });

      expect(onSuccessMock).toHaveBeenCalledTimes(2);
    });

    it('should not call watchFilesInOutDir or debounce method when extras.watch is false', async () => {
      await callRunCompiler({
        extras: {
          watch: false,
        },
      });

      expect(compiler['watchFilesInOutDir']).not.toHaveBeenCalled();
      expect(compiler['debounce']).not.toHaveBeenCalled();
    });

    it('should not call watchFilesInOutDir or debounce method when extras.watch is true but onSuccess is not defined', async () => {
      await callRunCompiler({
        extras: {
          watch: true,
        },
        onSuccess: false,
      });

      expect(compiler['watchFilesInOutDir']).not.toHaveBeenCalled();
      expect(compiler['debounce']).not.toHaveBeenCalled();
    });

    it('should call debounce method with debounceTime and onSuccess method and when extras.watch is true', async () => {
      const fixture = {
        onSuccess: jest.fn(),
      };

      await callRunCompiler({
        onSuccess: fixture.onSuccess,
        extras: {
          watch: true,
        },
      });

      expect(compiler['debounce']).toHaveBeenCalledWith(fixture.onSuccess, 150);
    });

    it('should call watchFilesInOutDir method with swcOptions and callback when extras.watch is true', async () => {
      swcDefaultsFactoryMock.mockReturnValueOnce('swcOptionsTest');
      debounceMock.mockReturnValueOnce('debounceTest');

      await callRunCompiler({
        extras: {
          watch: true,
        },
      });

      expect(compiler['watchFilesInOutDir']).toHaveBeenCalledWith(
        'swcOptionsTest',
        'debounceTest',
      );
    });

    it('should not call closeWatchers method when extras.watch is true', async () => {
      const closeWatchersMock = jest.fn();
      const fixture = {
        extras: {
          watch: true,
          assetsManager: {
            closeWatchers: closeWatchersMock,
          },
        },
      };

      await callRunCompiler({
        extras: fixture.extras,
      });

      await callRunCompiler({
        extras: fixture.extras,
        onSuccess: false,
      });

      expect(closeWatchersMock).not.toHaveBeenCalled();
    });

    it('should call closeWatchers method when extras.watch is false', async () => {
      const closeWatchersMock = jest.fn();
      const fixture = {
        extras: {
          watch: false,
          assetsManager: {
            closeWatchers: closeWatchersMock,
          },
        },
      };

      await callRunCompiler({
        extras: fixture.extras,
        onSuccess: false,
      });

      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(closeWatchersMock).toHaveBeenCalledTimes(2);
    });
  });
});
