import * as fs from 'fs/promises';
import { deleteOutDirIfEnabled } from '../../../../lib/compiler/helpers/delete-out-dir';
import { Configuration } from '../../../../lib/configuration';

jest.mock('fs/promises');

const mockedRm = fs.rm as jest.MockedFunction<typeof fs.rm>;

function createConfiguration(
  deleteOutDir: boolean,
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
    expect(mockedRm).toHaveBeenCalledWith('dist', {
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
    expect(mockedRm).toHaveBeenCalledWith('dist', {
      recursive: true,
      force: true,
    });
    expect(mockedRm).toHaveBeenCalledWith(
      './node_modules/.tmp/tsconfig.tsbuildinfo',
      { force: true },
    );
  });

  it('should not delete tsBuildInfoFile when tsOptions is undefined', async () => {
    const config = createConfiguration(true);
    await deleteOutDirIfEnabled(config, undefined, 'dist');
    expect(mockedRm).toHaveBeenCalledTimes(1);
    expect(mockedRm).toHaveBeenCalledWith('dist', {
      recursive: true,
      force: true,
    });
  });

  it('should not delete tsBuildInfoFile when tsOptions has no tsBuildInfoFile', async () => {
    const config = createConfiguration(true);
    const tsOptions = {};
    await deleteOutDirIfEnabled(config, undefined, 'dist', tsOptions);
    expect(mockedRm).toHaveBeenCalledTimes(1);
    expect(mockedRm).toHaveBeenCalledWith('dist', {
      recursive: true,
      force: true,
    });
  });
});
