import { readFile } from 'fs';
import { join } from 'path';

export class NestDependencyManager {
  constructor() {}
  
  public async read(): Promise<string[]> {
    const dependencies: string[] = [];
    const packageJsonContent: any = await this.readPackageJson();
    const productionDependencies: any = packageJsonContent.dependencies;
    const developmentDependencies: any = packageJsonContent.devDependencies;
    for (const dependency in productionDependencies) {
      dependencies.push(dependency);
    }
    for (const dependency in developmentDependencies) {
      dependencies.push(dependency);
    }
    return dependencies.filter((dependency) => dependency.indexOf('@nestjs') > -1);
  }
  
  public async readPackageJson(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      readFile(join(process.cwd(), 'package.json'), (error: NodeJS.ErrnoException, buffer: Buffer) => {
        if (error !== undefined && error !== null) {
          reject(error);
        } else {
          resolve(JSON.parse(buffer.toString()));
        }
      });
    });
  }
}
