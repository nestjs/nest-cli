export interface LockParser {
  stringify: (record: Record<string, any>) => string;
  parse: (file: string) => Record<string, any>
}
