import { join } from "path";

export class AbstractPackageManager {
  constructor(protected runner, protected logger) {}

  public install(directory) {
    const command = 'install --silent';
    const collect = true;
    return this.runner.run(command, collect, join(process.cwd(), directory));
  }

  public version() {
    const command = '--version';
    const collect = true;
    return this.runner.run(command, collect);
  }

  public get name() {
    return '';
  }
}
