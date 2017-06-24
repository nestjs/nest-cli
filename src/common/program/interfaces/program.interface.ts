import {Command} from './command.interface';

export type DeclareProgramHandler = { (program: Program): void };

export interface Program {
  version(version: string): Program
  help(content: string): Program
  declare(handler: DeclareProgramHandler): Program
  command(name: string, description: string): Command
  listen(): void
}