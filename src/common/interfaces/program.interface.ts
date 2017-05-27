import {Command} from './command.interface';
export interface Program {
  version(version: string): Program
  help(content: string): Program
  command(name: string, description: string): Command
  listen(): void
}