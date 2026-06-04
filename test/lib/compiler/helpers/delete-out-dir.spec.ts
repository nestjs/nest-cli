import * as fs from 'fs/promises';
import * as path from 'path';
import { deleteOutDirIfEnabled } from '../../../../lib/compiler/helpers/delete-out-dir';
import { Configuration } from '../../../../lib/configuration';

jest.mock('fs/promises');

const mockedRm = fs.rm as jest.MockedFunction<typeof fs.rm>;
const resolveFromCwd = (value: string) => path.resolve(process.cwd(), value);

function createConfiguration(deleteOutDir: boolean): Required<Configuration> {
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
    expect(mockedRm).toHaveBeenCalledWith(resolveFromCwd('dist'), {
      recursive: true,
      force: true,
    });
  });

  it('should delete the tsBuildInfoFile when deleteOutDir is enabled and tsOptions has tsBuildInfoFile', async () => {
    const config = createConfiguration(true);
    const tsOptions = {
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.tsbuildinfo',
    };
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(2);
    expect(mockedRm).toHaveBeenCalledWith(resolveFromCwd('dist'), {
      recursive: true,
      force: true,
    });
    expect(mockedRm).toHaveBeenCalledWith(
      resolveFromCwd('./node_modules/.tmp/tsconfig.tsbuildinfo'),
      { force: true },
    );
  });

  it('should not delete tsBuildInfoFile when tsOptions is undefined', async () => {
    const config = createConfiguration(true);
    await deleteOutDirIfEnabled(config, undefined, 'dist');
    expect(mockedRm).toHaveBeenCalledTimes(1);
    expect(mockedRm).toHaveBeenCalledWith(resolveFromCwd('dist'), {
      recursive: true,
      force: true,
    });
  });

  it('should not delete tsBuildInfoFile when tsOptions has no tsBuildInfoFile', async () => {
    const config = createConfiguration(true);
    const tsOptions = {};
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(1);
    expect(mockedRm).toHaveBeenCalledWith(resolveFromCwd('dist'), {
      recursive: true,
      force: true,
    });
  });

  it('should reject deleting the project root', async () => {
    const config = createConfiguration(true);

    await expect(deleteOutDirIfEnabled(config, undefined, '.')).rejects.toThrow(
      'Refusing to delete "outDir" path outside of or equal to the project directory: .',
    );
    expect(mockedRm).not.toHaveBeenCalled();
  });

  it('should reject deleting a parent directory via relative traversal', async () => {
    const config = createConfiguration(true);
    const outsidePath = path.join('..', 'outside-dist');

    await expect(
      deleteOutDirIfEnabled(config, undefined, outsidePath),
    ).rejects.toThrow(
      `Refusing to delete "outDir" path outside of or equal to the project directory: ${outsidePath}`,
    );
    expect(mockedRm).not.toHaveBeenCalled();
  });

  it('should reject deleting an absolute path outside the project', async () => {
    const config = createConfiguration(true);
    const outsidePath = path.resolve(process.cwd(), '..', 'outside-dist');

    await expect(
      deleteOutDirIfEnabled(config, undefined, outsidePath),
    ).rejects.toThrow(
      `Refusing to delete "outDir" path outside of or equal to the project directory: ${outsidePath}`,
    );
    expect(mockedRm).not.toHaveBeenCalled();
  });

  it('should reject deleting tsBuildInfoFile outside the project before deleting outDir', async () => {
    const config = createConfiguration(true);
    const outsidePath = path.join('..', 'tsconfig.tsbuildinfo');
    const tsOptions = {
      tsBuildInfoFile: outsidePath,
    };

    await expect(
      deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions),
    ).rejects.toThrow(
      `Refusing to delete "tsBuildInfoFile" path outside of or equal to the project directory: ${outsidePath}`,
    );
    expect(mockedRm).not.toHaveBeenCalled();
  });
});
