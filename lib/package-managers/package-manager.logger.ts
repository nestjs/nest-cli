export interface PackageManagerLogger {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}
