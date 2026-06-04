import { rm } from 'fs/promises';
import { isAbsolute, relative, resolve } from 'path';
import * as ts from 'typescript';
import { Configuration } from '../../configuration';
import { getValueOrDefault } from './get-value-or-default';

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
  const resolvedOutDir = resolvePathInsideProject(dirPath, 'outDir');
  const resolvedTsBuildInfoFile = tsOptions?.tsBuildInfoFile
    ? resolvePathInsideProject(tsOptions.tsBuildInfoFile, 'tsBuildInfoFile')
    : undefined;

  await rm(resolvedOutDir, {
    recursive: true,
    force: true,
  });
  if (resolvedTsBuildInfoFile) {
    await rm(resolvedTsBuildInfoFile, {
      force: true,
    });
  }
}

function resolvePathInsideProject(pathToDelete: string, propertyName: string) {
  const projectRoot = process.cwd();
  const resolvedPath = resolve(projectRoot, pathToDelete);
  const relativePath = relative(projectRoot, resolvedPath);
  const isProjectRoot = relativePath === '';
  const isOutsideProject =
    relativePath.startsWith('..') || isAbsolute(relativePath);

  if (isProjectRoot || isOutsideProject) {
    throw new Error(
      `Refusing to delete "${propertyName}" path outside of or equal to the project directory: ${pathToDelete}`,
    );
  }
  return resolvedPath;
}
