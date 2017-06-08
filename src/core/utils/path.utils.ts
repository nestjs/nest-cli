import * as path from 'path';
export class PathUtils {

  public static relative(origin: string, destination: string): string {
    const originDirName: string = path.dirname(origin);
    const destinationDirName: string = path.dirname(destination);
    console.log(originDirName);
    console.log(destinationDirName);
    return destination.replace(originDirName, '.');
  }
}
