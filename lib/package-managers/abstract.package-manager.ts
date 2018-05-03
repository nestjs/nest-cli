import { join } from 'path';
import { AbstractRunner } from '../runners/abstract.runner';
import { PackageManagerLogger } from './package-manager.logger';
import { ProjectDependency } from './project.dependency';
import { readFile } from 'fs';

export abstract class AbstractPackageManager {
  constructor(protected runner: AbstractRunner, protected logger: PackageManagerLogger) {}

  public async install(directory: string) {
    const command = 'install --silent';
    const collect = true;
    await this.runner.run(command, collect, join(process.cwd(), directory));
  }

  public async version(): Promise<string> {
    const command = '--version';
    const collect = true;
    const version: string = await this.runner.run(command, collect);
    return version;
  }

  public async addProduction(dependencies: string[], tag: string) {
    const commandArguments: string = `install --save ${ dependencies.join(`@${ tag } `) }`;
    await this.add(commandArguments);
  }

  public async addDevelopment(dependencies: string[], tag: string) {
    const commandArguments: string = `install --save-dev ${ dependencies.join(`@${ tag } `) }`;
    await this.add(commandArguments);
  }

  private async add(commandArguments: string) {
    const collect = true;
    await this.runner.run(commandArguments, collect);
  }

  public async getProduction(): Promise<ProjectDependency[]> {
    const packageJsonContent: any = await this.readPackageJson();
    const packageJsonDependencies: any = packageJsonContent.dependencies;
    const dependencies: ProjectDependency[] = [];
    for (const dependency in packageJsonDependencies) {
      dependencies.push({
        name: dependency,
        version: packageJsonDependencies[ dependency ]
      });
    }
    return dependencies;
  }
  
  public async getDevelopement(): Promise<ProjectDependency[]> {
    const packageJsonContent: any = await this.readPackageJson();
    const packageJsonDevDependencies: any = packageJsonContent.devDependencies;
    const dependencies: ProjectDependency[] = [];
    for (const dependency in packageJsonDevDependencies) {
      dependencies.push({
        name: dependency,
        version: packageJsonDevDependencies[ dependency ]
      });
    }
    return dependencies;
  }

  private async readPackageJson(): Promise<any> {
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

  public async updateProduction(dependencies: string[]) {
    const commandArguments: string = `update ${ dependencies.join(' ')}`;
    await this.update(commandArguments);
  }

  public async updateDevelopement(dependencies: string[]) {
    const commandArguments: string = `update ${ dependencies.join(' ')}`;
    await this.update(commandArguments);
  }

  private async update(commandArguments: string) {
    const collect = true;
    await this.runner.run(commandArguments, collect);
  }

  public async upgradeProduction(dependencies: string[], tag: string) {
    await this.deleteProduction(dependencies);
    await this.addProduction(dependencies, tag);
  }

  public async upgradeDevelopement(dependencies: string[], tag: string) {
    await this.deleteDevelopment(dependencies);
    await this.addDevelopment(dependencies, tag);
  }

  public async deleteProduction(dependencies: string[]) {
    const commandArguments: string = `uninstall --save ${ dependencies.join(` `) }`;
    await this.delete(commandArguments);
  }

  public async deleteDevelopment(dependencies: string[]) {
    const commandArguments: string = `uninstall --save-dev ${ dependencies.join(' ') }`;
    await this.delete(commandArguments);
  }

  public async delete(commandArguments: string) {
    const collect = true;
    await this.runner.run(commandArguments, collect);
  }

  public abstract get name(): string;
}
