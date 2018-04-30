import * as ora from 'ora';
import chalk from 'chalk';
import { AbstractPackageManager } from './abstract.package-manager';
import { RunnerFactory, Runner } from '../runners';
import { PackageManager } from './package-manager';
import { messages } from '../ui';
import { PackageManagerLogger } from './package-manager.logger';

export class NpmPackageManager extends AbstractPackageManager {
  constructor(logger: PackageManagerLogger) {
    super(RunnerFactory.create(Runner.NPM, logger), logger);
  }

  public async install(directory: string) {
    const spinner = ora({
      spinner: {
        "interval": 120,
        "frames": [
          "▹▹▹▹▹",
          "▸▹▹▹▹",
          "▹▸▹▹▹",
          "▹▹▸▹▹",
          "▹▹▹▸▹",
          "▹▹▹▹▸"
        ]
      },
      text: messages.PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS
    });
    spinner.start();

    try {
      await super.install(directory)
      spinner.succeed();
      this.logger.info();
      this.logger.info(messages.PACKAGE_MANAGER_INSTALLATION_SUCCEED(directory));
      this.logger.info(messages.GET_STARTED_INFORMATION);
      this.logger.info();
      this.logger.info(chalk.gray(messages.CHANGE_DIR_COMMAND(directory)));
      this.logger.info(chalk.gray(messages.START_COMMAND));
      this.logger.info();
    } catch {
      spinner.fail();
      this.logger.error(chalk.red(messages.PACKAGE_MANAGER_INSTALLATION_FAILED));
    }
  }

  public get name() {
    return PackageManager.NPM.toUpperCase();
  }
}
