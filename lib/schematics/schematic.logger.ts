export interface SchematicLogger {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}
