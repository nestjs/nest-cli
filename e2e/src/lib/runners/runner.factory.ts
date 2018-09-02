import { AbstractRunner } from './abstract.runner';
import { CleanRunner } from './clean.runner';
import { NestRunner } from './nest.runner';
import { Runner } from './runner';

export class RunnerFactory {
  public static create(runner: Runner): undefined | AbstractRunner {
    switch (runner) {
      case Runner.CLEAN:
        return new CleanRunner();
      case Runner.NEST:
        return new NestRunner();
      default:
        console.info(`[WARN] Unsupported runner: ${ runner }`);
    }
  }
}
