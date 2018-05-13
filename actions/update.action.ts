import { AbstractAction } from './abstract.action';
import { NestDependencyManager } from '../lib/dependency-managers';
import { PackageManagerFactory } from '../lib/package-managers';
import { Input } from '../commands';
import chalk from 'chalk';

export class UpdateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    const force: Input = options.find((option) => option.name === 'force');
    const tag: Input = options.find((option) => option.name === 'tag');
    if (force.value && tag.value === undefined) {
      console.error(chalk.red('You should specify a tag when force update.'));
    } else {
      const manager = new NestDependencyManager(await PackageManagerFactory.find());
      await manager.update(force.value as boolean, tag.value as string);
    }
  }
}
