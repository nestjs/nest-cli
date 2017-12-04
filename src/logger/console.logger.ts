import { Logger } from './logger.service';

export class ConsoleLogger implements Logger {
  public debug(...messages: any[]): void {
    this.flush(messages);
  }

  public error(...messages: any[]): void {
    this.flush(messages);
  }

  public info(...messages: any[]): void {
    this.flush(messages);
  }

  public log(...messages: any[]): void {
    this.flush(messages);
  }

  public warn(...messages: any[]): void {
    this.flush(messages);
  }

  private flush(...messages: any[]): void {
    console.log(messages.reduce((previous, current) => {
      return previous.concat(' ').concat(current);
    }).join(' '));
  }
}
