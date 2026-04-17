import { resolve, sep } from 'path';

jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    close: jest.fn(),
  }),
}));

jest.mock('glob', () => ({
  sync: jest.fn(),
}));

jest.mock('fs', () => ({
  copyFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  statSync: jest.fn(() => ({
    isFile: () => true,
    isDirectory: () => false,
  })),
}));

import { copyFileSync } from 'fs';
import { sync as globSync } from 'glob';
import { AssetsManager } from '../../../lib/compiler/assets-manager';
import { Configuration } from '../../../lib/configuration';

const mockedCopyFileSync = copyFileSync as jest.MockedFunction<typeof copyFileSync>;
const mockedGlobSync = globSync as unknown as jest.MockedFunction<
  (...args: any[]) => string[]
>;

function createConfiguration(
  assetOutDir: string | undefined,
): Required<Configuration> {
  return {
    monorepo: false,
    sourceRoot: 'src',
    entryFile: 'main',
    exec: '',
    projects: {},
    language: 'ts',
    collection: '@nestjs/schematics',
    compilerOptions: {
      assets: [
        {
          include: '**/static/**/*.txt',
          ...(assetOutDir ? { outDir: assetOutDir } : {}),
        } as any,
      ],
    },
    generateOptions: {},
  };
}

describe('AssetsManager', () => {
  const cwd = process.cwd();

  beforeEach(() => {
    mockedCopyFileSync.mockReset();
    mockedGlobSync.mockReset();
  });

  it('strips the configured sourceRoot when no rootDir is provided', () => {
    const sourceFile = resolve(cwd, 'src', 'static', 'foo.txt');
    mockedGlobSync.mockReturnValue([sourceFile]);

    const manager = new AssetsManager();
    manager.copyAssets(createConfiguration('dist/'), undefined, 'dist', false);

    expect(mockedCopyFileSync).toHaveBeenCalledTimes(1);
    const [, dest] = mockedCopyFileSync.mock.calls[0];
    expect(dest).toBe(['dist', 'static', 'foo.txt'].join(sep));
  });

  it('strips the provided TypeScript rootDir instead of sourceRoot when emit moves up (regression for #3387)', () => {
    // Reproduces `nest build --path tsconfig.json`: the effective TS rootDir
    // widens to the project root, so JavaScript files emit under <outDir>/src/.
    // Assets must follow the same widening, otherwise they end up at
    // <outDir>/static/ while the runtime looks under <outDir>/src/static/.
    const sourceFile = resolve(cwd, 'src', 'static', 'foo.txt');
    mockedGlobSync.mockReturnValue([sourceFile]);

    const manager = new AssetsManager();
    manager.copyAssets(
      createConfiguration('dist/'),
      undefined,
      'dist',
      false,
      cwd,
    );

    expect(mockedCopyFileSync).toHaveBeenCalledTimes(1);
    const [, dest] = mockedCopyFileSync.mock.calls[0];
    expect(dest).toBe(['dist', 'src', 'static', 'foo.txt'].join(sep));
  });

  it('preserves backward compatibility when the provided rootDir matches sourceRoot', () => {
    const sourceFile = resolve(cwd, 'src', 'static', 'foo.txt');
    mockedGlobSync.mockReturnValue([sourceFile]);

    const manager = new AssetsManager();
    manager.copyAssets(
      createConfiguration('dist/'),
      undefined,
      'dist',
      false,
      resolve(cwd, 'src'),
    );

    expect(mockedCopyFileSync).toHaveBeenCalledTimes(1);
    const [, dest] = mockedCopyFileSync.mock.calls[0];
    expect(dest).toBe(['dist', 'static', 'foo.txt'].join(sep));
  });
});
