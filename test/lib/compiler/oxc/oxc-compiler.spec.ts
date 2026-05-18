import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader';
import { OxcCompiler } from '../../../../lib/compiler/oxc/oxc-compiler';
import * as oxcDefaults from '../../../../lib/compiler/defaults/oxc-defaults';

jest.mock('chokidar');

describe('OXC Compiler', () => {
  let compiler: OxcCompiler;
  let oxcDefaultsFactoryMock = jest.fn();
  const cwd = process.cwd();
  const actualOxcDefaultsFactory = jest.requireActual(
    '../../../../lib/compiler/defaults/oxc-defaults',
  ).oxcDefaultsFactory;

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

    compiler = new OxcCompiler(PluginsLoaderStub);

    (oxcDefaults as any).oxcDefaultsFactory = oxcDefaultsFactoryMock;

    compiler['runOxc'] = jest.fn();
    compiler['runTypeChecker'] = jest.fn();
    compiler['debounce'] = jest.fn();
    compiler['watchFilesInSrcDir'] = jest.fn();

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.chdir(cwd);
  });

  describe('run', () => {
    it('should call oxcDefaultsFactory with tsOptions and configuration', async () => {
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
      expect(oxcDefaultsFactoryMock).toHaveBeenCalledWith(
        fixture.extras.tsOptions,
        fixture.configuration,
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

    it('should call runOxc', async () => {
      oxcDefaultsFactoryMock.mockReturnValueOnce('oxcOptionsTest');

      const fixture = {
        extras: {
          watch: false,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runOxc']).toHaveBeenCalledWith(
        'oxcOptionsTest',
        fixture.extras,
      );

      fixture.extras.watch = false;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runOxc']).toHaveBeenCalledWith(
        'oxcOptionsTest',
        fixture.extras,
      );
    });
  });

  describe('transpileFile', () => {
    it('should write transformed output to outDir', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'src'));
      writeFileSync(join(directory, 'src', 'main.ts'), 'const value = 1;');
      process.chdir(directory);

      const transform = jest.fn().mockResolvedValue({
        code: 'const value = 1;\n',
        errors: [],
      });
      compiler['loadOxcTransform'] = jest.fn().mockResolvedValue({ transform });

      const options = actualOxcDefaultsFactory({ rootDir: 'src' }, {
        sourceRoot: 'src',
      } as any);

      await compiler['transpileFile']('src/main.ts', options);

      expect(transform).toHaveBeenCalledWith(
        'src/main.ts',
        'const value = 1;',
        expect.objectContaining({
          lang: 'ts',
        }),
      );
      expect(readFileSync(join(directory, 'dist', 'main.js'), 'utf8')).toBe(
        'const value = 1;\n',
      );

      rmSync(directory, { recursive: true, force: true });
    });

    it('should throw when oxc reports errors', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'src'));
      writeFileSync(join(directory, 'src', 'main.ts'), 'const value = ;');
      process.chdir(directory);

      compiler['loadOxcTransform'] = jest.fn().mockResolvedValue({
        transform: jest.fn().mockResolvedValue({
          code: '',
          errors: [{ message: 'Unexpected token' }],
        }),
      });

      const options = actualOxcDefaultsFactory({}, {
        sourceRoot: 'src',
      } as any);

      await expect(
        compiler['transpileFile']('src/main.ts', options),
      ).rejects.toThrow('Unexpected token');

      rmSync(directory, { recursive: true, force: true });
    });

    it('should emit external source maps and declaration files when configured', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'src'));
      writeFileSync(join(directory, 'src', 'service.ts'), 'export class S {}');
      process.chdir(directory);

      compiler['loadOxcTransform'] = jest.fn().mockResolvedValue({
        transform: jest.fn().mockResolvedValue({
          code: 'export class S {}\n',
          map: {
            version: 3,
            sources: ['src/service.ts'],
            names: [],
            mappings: '',
          },
          declaration: 'export declare class S {}\n',
          declarationMap: {
            version: 3,
            sources: ['src/service.ts'],
            names: [],
            mappings: '',
          },
          errors: [],
        }),
      });

      const options = actualOxcDefaultsFactory(
        {
          rootDir: 'src',
          sourceMap: true,
        },
        {
          sourceRoot: 'src',
          compilerOptions: {
            builder: {
              type: 'oxc',
              options: {
                declaration: true,
              },
            },
          },
        } as any,
      );

      await compiler['transpileFile']('src/service.ts', options);

      expect(readFileSync(join(directory, 'dist', 'service.js'), 'utf8')).toBe(
        'export class S {}\n\n//# sourceMappingURL=service.js.map',
      );
      expect(
        readFileSync(join(directory, 'dist', 'service.js.map'), 'utf8'),
      ).toContain('"sources":["src/service.ts"]');
      expect(
        readFileSync(join(directory, 'dist', 'service.d.ts'), 'utf8'),
      ).toBe(
        'export declare class S {}\n\n//# sourceMappingURL=service.d.ts.map',
      );
      expect(
        readFileSync(join(directory, 'dist', 'service.d.ts.map'), 'utf8'),
      ).toContain('"sources":["src/service.ts"]');

      rmSync(directory, { recursive: true, force: true });
    });

    it('should inline source maps when inlineSourceMap is configured', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'src'));
      writeFileSync(join(directory, 'src', 'main.ts'), 'const value = 1;');
      process.chdir(directory);

      compiler['loadOxcTransform'] = jest.fn().mockResolvedValue({
        transform: jest.fn().mockResolvedValue({
          code: 'const value = 1;\n',
          map: {
            version: 3,
            sources: ['src/main.ts'],
            names: [],
            mappings: '',
          },
          errors: [],
        }),
      });

      const options = actualOxcDefaultsFactory(
        {
          rootDir: 'src',
          inlineSourceMap: true,
        },
        { sourceRoot: 'src' } as any,
      );

      await compiler['transpileFile']('src/main.ts', options);

      const output = readFileSync(join(directory, 'dist', 'main.js'), 'utf8');
      expect(output).toContain(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,',
      );
      expect(existsSync(join(directory, 'dist', 'main.js.map'))).toBe(false);

      rmSync(directory, { recursive: true, force: true });
    });

    it('should preserve module-specific output extensions', () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      process.chdir(directory);
      const options = actualOxcDefaultsFactory({ rootDir: 'src' }, {
        sourceRoot: 'src',
      } as any);

      expect(compiler['getOutputPath']('src/module.mts', options, '.js')).toBe(
        join(directory, 'dist', 'module.mjs'),
      );
      expect(compiler['getOutputPath']('src/module.cts', options, '.js')).toBe(
        join(directory, 'dist', 'module.cjs'),
      );

      rmSync(directory, { recursive: true, force: true });
    });

    it('should ignore declaration files and unsupported extensions', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'src'));
      writeFileSync(join(directory, 'src', 'main.ts'), 'const value = 1;');
      writeFileSync(
        join(directory, 'src', 'types.d.ts'),
        'declare const x: 1;',
      );
      writeFileSync(join(directory, 'src', 'schema.graphql'), 'type Query');
      process.chdir(directory);

      const options = actualOxcDefaultsFactory({}, {
        sourceRoot: 'src',
      } as any);

      await expect(compiler['getFilesToCompile'](options)).resolves.toEqual([
        'src/main.ts',
      ]);

      rmSync(directory, { recursive: true, force: true });
    });

    it('should pass Nest decorator metadata options to OXC', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'src'));
      writeFileSync(
        join(directory, 'src', 'service.ts'),
        `
function Injectable(): ClassDecorator {
  return () => undefined;
}

class Dependency {}

@Injectable()
export class Service {
  constructor(private readonly dependency: Dependency) {}
}
`,
      );
      process.chdir(directory);

      const transform = jest.fn().mockResolvedValue({
        code: 'transformed service',
        errors: [],
      });
      compiler['loadOxcTransform'] = jest.fn().mockResolvedValue({ transform });

      const options = actualOxcDefaultsFactory(
        {
          rootDir: 'src',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
        { sourceRoot: 'src' } as any,
      );

      await compiler['transpileFile']('src/service.ts', options);

      expect(transform).toHaveBeenCalledWith(
        'src/service.ts',
        expect.stringContaining('@Injectable()'),
        expect.objectContaining({
          decorator: {
            legacy: true,
            emitDecoratorMetadata: true,
          },
          typescript: expect.objectContaining({
            allowNamespaces: true,
          }),
        }),
      );
      expect(readFileSync(join(directory, 'dist', 'service.js'), 'utf8')).toBe(
        'transformed service',
      );

      rmSync(directory, { recursive: true, force: true });
    });

    it('should remove compiled outputs for deleted source files', () => {
      const directory = mkdtempSync(join(tmpdir(), 'nest-cli-oxc-'));
      mkdirSync(join(directory, 'dist'), { recursive: true });
      writeFileSync(join(directory, 'dist', 'main.js'), '');
      writeFileSync(join(directory, 'dist', 'main.js.map'), '');
      writeFileSync(join(directory, 'dist', 'main.d.ts'), '');
      writeFileSync(join(directory, 'dist', 'main.d.ts.map'), '');
      process.chdir(directory);

      const options = actualOxcDefaultsFactory({ rootDir: 'src' }, {
        sourceRoot: 'src',
      } as any);

      compiler['removeCompiledFile']('src/main.ts', options);

      expect(existsSync(join(directory, 'dist', 'main.js'))).toBe(false);
      expect(existsSync(join(directory, 'dist', 'main.js.map'))).toBe(false);
      expect(existsSync(join(directory, 'dist', 'main.d.ts'))).toBe(false);
      expect(existsSync(join(directory, 'dist', 'main.d.ts.map'))).toBe(false);

      rmSync(directory, { recursive: true, force: true });
    });
  });
});
