import { AbstractAction } from './abstract.action';
import { NestDependencyManager } from '../lib/dependency-managers';

export class UpdateAction extends AbstractAction {
  public async handle(args: any, options: any, logger: any) {
    const manager = new NestDependencyManager();
    const dependencies: string[] = await manager.read();
    logger.info(dependencies);
  }
}