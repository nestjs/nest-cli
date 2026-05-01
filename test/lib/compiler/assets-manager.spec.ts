jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    close: jest.fn(),
  })),
}));

const mockCopyFileSync = jest.fn<void, [string, string]>();
const mockMkdirSync = jest.fn<void, [string, unknown?]>();
const mockStatSync = jest.fn<
  { isFile: () => boolean; isDirectory: () => boolean },
  [string]
>(() => ({
  isFile: () => true,
  isDirectory: () => false,
}));
const mockRmSync = jest.fn<void, [string, unknown?]>();

jest.mock('fs', () => ({
  copyFileSync: (src: string, dest: string) => mockCopyFileSync(src, dest),
  mkdirSync: (path: string, opts?: unknown) => mockMkdirSync(path, opts),
  statSync: (path: string) => mockStatSync(path),
  rmSync: (path: string, opts?: unknown) => mockRmSync(path, opts),
}));

const mockGlobSync = jest.fn<string[], [string, unknown?]>();
jest.mock('glob', () => ({
  sync: (pattern: string, opts?: unknown) => mockGlobSync(pattern, opts),
}));

import { join } from 'path';
import { AssetsManager } from '../../../lib/compiler/assets-manager';
import { Configuration } from '../../../lib/configuration';

const cwd = process.cwd();

describe('AssetsManager', () => {
  let assetsManager: AssetsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    assetsManager = new AssetsManager();
  });

  const buildConfig = (
    overrides: Partial<Configuration> = {},
  ): Required<Configuration> => ({
    language: 'ts',
    sourceRoot: 'src',
    collection: '@nestjs/schematics',
    entryFile: 'main',
    exec: 'node',
    monorepo: false,
    projects: {},
    compilerOptions: {},
    generateOptions: {},
    ...overrides,
  });

  describe('copyAssets', () => {
    it('should not call copy/mkdir when there are no assets configured', () => {
      const configuration = buildConfig();

      assetsManager.copyAssets(configuration, undefined, 'dist', false);

      expect(mockGlobSync).not.toHaveBeenCalled();
      expect(mockCopyFileSync).not.toHaveBeenCalled();
    });

    it('should resolve assets relative to the named project sourceRoot when called with a library project name', () => {
      const matchedFile = join(
        cwd,
        'libs',
        'my-lib',
        'src',
        'library-assets',
        'file.html',
      );
      mockGlobSync.mockReturnValue([matchedFile]);

      const configuration = buildConfig({
        monorepo: true,
        projects: {
          api: {
            type: 'application',
            sourceRoot: 'apps/api/src',
            compilerOptions: {
              assets: ['app-assets/*.html'],
            },
          },
          'my-lib': {
            type: 'library',
            sourceRoot: 'libs/my-lib/src',
            compilerOptions: {
              assets: ['library-assets/*.html'],
            },
          },
        },
      });

      assetsManager.copyAssets(configuration, 'my-lib', 'dist', false);

      // The first call to glob.sync should be for the matched glob pattern.
      expect(mockGlobSync).toHaveBeenCalled();
      const firstCallArg = mockGlobSync.mock.calls[0][0] as string;
      // Path is normalized to forward slashes inside copyAssets.
      expect(firstCallArg).toContain('libs/my-lib/src/library-assets/*.html');

      // copyFileSync should be called with the destination under the app's outDir.
      expect(mockCopyFileSync).toHaveBeenCalled();
    });

    it('should respect a per-asset outDir for library assets', () => {
      const matchedFile = join(
        cwd,
        'libs',
        'my-lib',
        'src',
        'proto',
        'foo.proto',
      );
      mockGlobSync.mockReturnValue([matchedFile]);

      const configuration = buildConfig({
        monorepo: true,
        projects: {
          'my-lib': {
            type: 'library',
            sourceRoot: 'libs/my-lib/src',
            compilerOptions: {
              assets: [
                {
                  glob: '',
                  include: 'proto/*.proto',
                  outDir: 'dist/libs/my-lib',
                },
              ],
            },
          },
        },
      });

      assetsManager.copyAssets(configuration, 'my-lib', 'dist', false);

      // copyFileSync's destination (second argument) should reflect the
      // per-asset outDir, not the app outDir.
      expect(mockCopyFileSync).toHaveBeenCalled();
      const dest = mockCopyFileSync.mock.calls[0][1] as string;
      expect(dest.replace(/\\/g, '/')).toContain('dist/libs/my-lib');
    });
  });
});
