import * as path from 'path';

/**
 * Helper function for returning a copy destination filename
 *
 * @description used in `assets-manager.ts` (copy from `copyfiles`)
 * @see https://github.com/calvinmetcalf/copyfiles/blob/master/index.js#L22
 */
export function copyPathResolve(filePath: string, outDir: string, up: number) {
  return path.join(outDir, dealWith(filePath, up));
}

function dealWith(inPath: string, up: number) {
  if (!up) {
    return inPath;
  }

  if (depth(inPath) < up) {
    throw new Error('cant go up that far');
  }

  return path.join(...path.normalize(inPath).split(path.sep).slice(up));
}

function depth(string: string) {
  return path.normalize(string).split(path.sep).length - 1;
}
