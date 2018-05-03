import { AbstractAction } from './abstract.action';
import { NestDependencyManager } from '../lib/dependency-managers';
import { PackageManagerFactory } from '../lib/package-managers';

interface UpdateOptions {
  force: boolean;
  tag: string;
}

export class UpdateAction extends AbstractAction {
  public async handle(args: any, options: UpdateOptions, logger: any) {
    const manager = new NestDependencyManager(await PackageManagerFactory.find(logger));
    await manager.update(options.force, options.tag);
  }
}
