import { Command } from 'commander';
import { AbstractCommand } from './abstract.command.js';

export class DoctorCommand extends AbstractCommand {
  public load(program: Command) {
    program
      .command('doctor')
      .description('Diagnose common issues in a Nest project.')
      .action(async () => {
        await this.action.handle();
      });
  }
}
