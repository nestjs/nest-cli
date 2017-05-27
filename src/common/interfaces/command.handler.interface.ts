export interface CommandHandler {
  execute(args: any, options: any, logger: any): void;
}
