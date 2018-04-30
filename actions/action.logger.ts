export interface ActionLogger {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}
