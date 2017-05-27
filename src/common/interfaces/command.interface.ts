export interface Command {
  alias(name: string): Command
  argument(name: string, description: string): Command
  option(name: string, description: string): Command
  handler(): Command
}