export interface RunnerLogger {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}
