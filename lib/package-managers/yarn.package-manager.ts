import * as ora from 'ora';
import chalk from 'chalk';
import { AbstractPackageManager } from './abstract.package-manager';
import { RunnerFactory, Runner } from '../runners';
import { PackageManager } from './package-manager';
import { messages } from '../ui';

export class YarnPackageManager extends AbstractPackageManager {
  constructor(logger) {
    super(RunnerFactory.create(Runner.YARN, logger), logger);
  }

  public install(directory) {
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
    super.install(directory)
      .then(() => {
        spinner.succeed();
        this.logger.info();
        this.logger.info(messages.PACKAGE_MANAGER_INSTALLATION_SUCCEED(directory));
        this.logger.info(messages.GET_STARTED_INFORMATION);
        this.logger.info();
        this.logger.info(chalk.gray(messages.CHANGE_DIR_COMMAND(directory)));
        this.logger.info(chalk.gray(messages.START_COMMAND));
        this.logger.info();
      })
      .catch(() => {
        const message = messages.PACKAGE_MANAGER_INSTALLATION_FAILED;
        this.logger.error(chalk.red(message));
      });
  }

  public get name() {
    return PackageManager.YARN.toUpperCase();
  }
}
