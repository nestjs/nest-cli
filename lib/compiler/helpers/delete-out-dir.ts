import { rm } from 'fs/promises';
import * as ts from 'typescript';
import { Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';
import {
  areOutsidePathsAllowed,
  assertPathInsideProject,
} from './path-confinement.js';

export async function deleteOutDirIfEnabled(
  configuration: Required<Configuration>,
  appName: string | undefined,
  dirPath: string,
  tsOptions?: ts.CompilerOptions,
) {
  const isDeleteEnabled = getValueOrDefault<boolean>(
    configuration,
    'compilerOptions.deleteOutDir',
    appName,
  );
  if (!isDeleteEnabled) {
    return;
  }

  const shouldValidate = !areOutsidePathsAllowed(configuration, appName);
  const tsBuildInfoFile = tsOptions?.tsBuildInfoFile;

  // Both paths are validated before anything is removed, so that a rejected
  // "tsBuildInfoFile" cannot leave a half-deleted output directory behind.
  const outDirToDelete = shouldValidate
    ? assertPathInsideProject(dirPath, 'outDir')
    : dirPath;
  const tsBuildInfoFileToDelete =
    shouldValidate && tsBuildInfoFile
      ? assertPathInsideProject(tsBuildInfoFile, 'tsBuildInfoFile')
      : tsBuildInfoFile;

  await rm(outDirToDelete, { recursive: true, force: true });
  if (tsBuildInfoFileToDelete) {
    await rm(tsBuildInfoFileToDelete, { force: true });
  }
}
