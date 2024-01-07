export interface Reader {
  list(): string[];
  read(name: string): string;
  readAnyOf(filenames: string[]): string | undefined;
}
