import { confirm } from '@inquirer/prompts';
import { red } from 'ansis';
import { DeployCommandContext } from '../commands/index.js';
import { PackageManagerFactory } from '../lib/package-managers/index.js';
import { MauRunner } from '../lib/runners/mau.runner.js';
import { ERROR_PREFIX, INFO_PREFIX, MESSAGES } from '../lib/ui/index.js';
import { gracefullyExitOnPromptError } from '../lib/utils/gracefully-exit-on-prompt-error.js';
import { isInteractive } from '../lib/utils/is-interactive.js';
import { MAU_PACKAGE_NAME, findMauBinary } from '../lib/utils/mau.js';
import { AbstractAction } from './abstract.action.js';

const INSTALL_COMMAND = `npm install --save-dev ${MAU_PACKAGE_NAME}`;

export class DeployAction extends AbstractAction {
  public async handle(context: DeployCommandContext) {
    const binaryPath = findMauBinary() ?? (await this.installMau());
    const runner = new MauRunner(binaryPath);

    // Not collected: mau owns the terminal from here on, so its output and
    // any prompts it shows must reach the user directly.
    await runner.run(['deploy', ...context.args].join(' '));
  }

  private async installMau(): Promise<string> {
    if (!isInteractive()) {
      console.error(
        `\n${ERROR_PREFIX} ${MESSAGES.MAU_NOT_INSTALLED_NON_INTERACTIVE(
          MAU_PACKAGE_NAME,
          INSTALL_COMMAND,
        )}`,
      );
      throw new Error(MESSAGES.MAU_INSTALLATION_FAILED(MAU_PACKAGE_NAME));
    }

    const shouldInstall = await confirm({
      message: MESSAGES.MAU_INSTALLATION_QUESTION(MAU_PACKAGE_NAME),
      default: true,
    }).catch(gracefullyExitOnPromptError);

    if (!shouldInstall) {
      console.error(
        `\n${ERROR_PREFIX} ${MESSAGES.MAU_INSTALLATION_DECLINED(
          MAU_PACKAGE_NAME,
          INSTALL_COMMAND,
        )}`,
      );
      throw new Error(MESSAGES.MAU_INSTALLATION_FAILED(MAU_PACKAGE_NAME));
    }

    console.info(
      `${INFO_PREFIX} ${MESSAGES.MAU_INSTALLATION_IN_PROGRESS(MAU_PACKAGE_NAME)}`,
    );
    try {
      const manager = await PackageManagerFactory.find();
      await manager.addDevelopment([MAU_PACKAGE_NAME], 'latest');
    } catch (error) {
      if (error instanceof Error && error.message) {
        console.error(red(error.message));
      }
      throw new Error(MESSAGES.MAU_INSTALLATION_FAILED(MAU_PACKAGE_NAME));
    }

    // Resolve again rather than assuming a path: the package manager decides
    // where the package physically lands.
    const binaryPath = findMauBinary();
    if (!binaryPath) {
      throw new Error(MESSAGES.MAU_INSTALLATION_FAILED(MAU_PACKAGE_NAME));
    }
    return binaryPath;
  }
}
