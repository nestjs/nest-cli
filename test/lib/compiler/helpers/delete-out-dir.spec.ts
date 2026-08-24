import * as fs from 'fs/promises';
import { resolve } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteOutDirIfEnabled } from '../../../../lib/compiler/helpers/delete-out-dir.js';
import { Configuration } from '../../../../lib/configuration/index.js';

vi.mock('fs/promises', () => ({
  rm: vi.fn(),
}));

const mockedRm = vi.mocked(fs.rm);

const fromProjectRoot = (value: string) => resolve(process.cwd(), value);

function createConfiguration(
  deleteOutDir: boolean,
  allowOutsidePaths?: boolean,
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
      deleteOutDir,
      ...(allowOutsidePaths === undefined ? {} : { allowOutsidePaths }),
    },
    generateOptions: {},
  };
}

describe('deleteOutDirIfEnabled', () => {
  beforeEach(() => {
    mockedRm.mockReset();
    mockedRm.mockResolvedValue(undefined);
  });

  it('should not delete anything when deleteOutDir is disabled', async () => {
    const config = createConfiguration(false);
    await deleteOutDirIfEnabled(config, undefined, 'dist');
    expect(mockedRm).not.toHaveBeenCalled();
  });

  it('should delete the output directory when deleteOutDir is enabled', async () => {
    const config = createConfiguration(true);
    await deleteOutDirIfEnabled(config, undefined, 'dist');
    expect(mockedRm).toHaveBeenCalledWith(fromProjectRoot('dist'), {
      recursive: true,
      force: true,
      maxRetries: 3,
    });
  });

  it('should delete the tsBuildInfoFile when deleteOutDir is enabled and tsOptions has tsBuildInfoFile', async () => {
    const config = createConfiguration(true);
    const tsOptions = {
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.tsbuildinfo',
    };
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(2);
    expect(mockedRm).toHaveBeenCalledWith(fromProjectRoot('dist'), {
      recursive: true,
      force: true,
      maxRetries: 3,
    });
    expect(mockedRm).toHaveBeenCalledWith(
      fromProjectRoot('./node_modules/.tmp/tsconfig.tsbuildinfo'),
      { force: true, maxRetries: 3 },
    );
  });

  it('should delete the default buildinfo file when "incremental" is enabled without an explicit tsBuildInfoFile', async () => {
    const config = createConfiguration(true);
    // With "outDir" and "rootDir" both set, TypeScript places the default
    // buildinfo next to the tsconfig - outside "outDir".
    const tsOptions = {
      incremental: true,
      outDir: fromProjectRoot('dist'),
      rootDir: fromProjectRoot('src'),
      configFilePath: fromProjectRoot('tsconfig.build.json'),
    };
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(2);
    expect(mockedRm).toHaveBeenCalledWith(
      fromProjectRoot('tsconfig.build.tsbuildinfo'),
      { force: true, maxRetries: 3 },
    );
  });

  it('should not delete a buildinfo file when incremental compilation is disabled', async () => {
    const config = createConfiguration(true);
    const tsOptions = {
      outDir: fromProjectRoot('dist'),
      configFilePath: fromProjectRoot('tsconfig.build.json'),
    };
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(1);
  });

  it('should not delete tsBuildInfoFile when tsOptions is undefined', async () => {
    const config = createConfiguration(true);
    await deleteOutDirIfEnabled(config, undefined, 'dist');
    expect(mockedRm).toHaveBeenCalledTimes(1);
    expect(mockedRm).toHaveBeenCalledWith(fromProjectRoot('dist'), {
      recursive: true,
      force: true,
      maxRetries: 3,
    });
  });

  it('should not delete tsBuildInfoFile when tsOptions has no tsBuildInfoFile', async () => {
    const config = createConfiguration(true);
    const tsOptions = {};
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(1);
    expect(mockedRm).toHaveBeenCalledWith(fromProjectRoot('dist'), {
      recursive: true,
      force: true,
      maxRetries: 3,
    });
  });

  describe('path confinement', () => {
    it('should refuse to delete an outDir outside the project by default', async () => {
      const config = createConfiguration(true);
      await expect(
        deleteOutDirIfEnabled(config, undefined, '../../etc'),
      ).rejects.toThrow(/outside of or equal to the project directory/);
      expect(mockedRm).not.toHaveBeenCalled();
    });

    it('should refuse to delete the project directory itself', async () => {
      const config = createConfiguration(true);
      await expect(
        deleteOutDirIfEnabled(config, undefined, '.'),
      ).rejects.toThrow(/outside of or equal to the project directory/);
      expect(mockedRm).not.toHaveBeenCalled();
    });

    it('should refuse to delete a tsBuildInfoFile outside the project', async () => {
      const config = createConfiguration(true);
      await expect(
        deleteOutDirIfEnabled(config, undefined, 'dist', {
          tsBuildInfoFile: '../../etc/passwd',
        }),
      ).rejects.toThrow(/outside of or equal to the project directory/);
      // The outDir is validated together with tsBuildInfoFile, so a rejected
      // build info path cannot leave a half-deleted output directory behind
      expect(mockedRm).not.toHaveBeenCalled();
    });

    it('should refuse to delete a default buildinfo path outside the project', async () => {
      const config = createConfiguration(true);
      await expect(
        deleteOutDirIfEnabled(config, undefined, 'dist', {
          incremental: true,
          outDir: fromProjectRoot('dist'),
          rootDir: fromProjectRoot('src'),
          configFilePath: resolve(process.cwd(), '..', 'tsconfig.json'),
        }),
      ).rejects.toThrow(/outside of or equal to the project directory/);
      expect(mockedRm).not.toHaveBeenCalled();
    });

    it('should delete outside paths when allowOutsidePaths is enabled', async () => {
      const config = createConfiguration(true, true);
      await deleteOutDirIfEnabled(config, undefined, '../outside-dist');
      expect(mockedRm).toHaveBeenCalledWith('../outside-dist', {
        recursive: true,
        force: true,
        maxRetries: 3,
      });
    });
  });
});
