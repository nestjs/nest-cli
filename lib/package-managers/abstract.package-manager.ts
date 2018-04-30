import { join } from 'path';
import { AbstractRunner } from '../runners/abstract.runner';
import { PackageManagerLogger } from './package-manager.logger';

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

  public abstract get name(): string;
}
