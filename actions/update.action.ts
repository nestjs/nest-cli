import { AbstractAction } from './abstract.action';
import { NestDependencyManager } from '../lib/dependency-managers';
import { PackageManagerFactory } from '../lib/package-managers';
import { Input } from '../commands';

interface UpdateOptions {
  force: boolean;
  tag: string;
}

export class UpdateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    // const manager = new NestDependencyManager(await PackageManagerFactory.find());
    // await manager.update(options.force, options.tag);
  }
}
