import { rm } from 'fs/promises';
import * as ts from 'typescript';
import { Configuration } from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';
import {
  areOutsidePathsAllowed,
  assertPathInsideProject,
} from './path-confinement.js';

/**
 * A recursive delete is not atomic: it walks the tree, and anything created
 * between the "readdir" of a directory and its "rmdir" makes the removal fail
 * with ENOTEMPTY. Concurrent writers into "outDir" are common in monorepos
 * (a sibling "tsc --noEmit --incremental" dropping its buildinfo there, for
 * instance), which turns "deleteOutDir" into a flaky build. Node already
 * treats ENOTEMPTY - along with EBUSY, EMFILE, ENFILE and EPERM, the errors
 * Windows raises for a file another process still holds - as retryable, but
 * only retries when "maxRetries" is set; it defaults to 0.
 *
 * See https://github.com/nestjs/nest-cli/issues/3509
 */
const RM_MAX_RETRIES = 3;

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

  await rm(outDirToDelete, {
    recursive: true,
    force: true,
    maxRetries: RM_MAX_RETRIES,
  });
  if (tsBuildInfoFileToDelete) {
    await rm(tsBuildInfoFileToDelete, {
      force: true,
      maxRetries: RM_MAX_RETRIES,
    });
  }
}
