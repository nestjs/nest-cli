export interface Reader {
    list(): string[] | Promise<string[]>;
    read(name: string): string | Promise<string>;
    readAnyOf(filenames: string[]): string | Promise<string | undefined>;
}
