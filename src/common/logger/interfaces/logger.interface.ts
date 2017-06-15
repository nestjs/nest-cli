export interface Logger {
  debug(...messages: any[]): void
  error(...messages: any[]): void
  info(...messages: any[]): void
  log(...messages: any[]): void
  warn(...messages: any[]): void
}
