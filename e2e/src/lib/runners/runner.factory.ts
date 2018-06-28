import { AbstractRunner } from './abstract.runner';
import { NestRunner } from './nest.runner';
import { NpmRunner } from './npm.runner';
import { Runner } from './runner';
import { YarnRunner } from './yarn.runner';

export class RunnerFactory {
  public static create(runner: Runner): undefined | AbstractRunner {
    switch (runner) {
      case Runner.NEST:
        return new NestRunner();
      case Runner.NPM:
        return new NpmRunner();
      case Runner.YARN:
        return new YarnRunner();
      default:
        console.info(`[WARN] Unsupported runner: ${ runner }`);
    }
  }
}
