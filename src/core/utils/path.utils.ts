import * as path from 'path';
export class PathUtils {

  public static relative(origin: string, destination: string): string {
    const originDirName: string = path.dirname(origin);
    return destination.replace(originDirName, '.');
  }
}
