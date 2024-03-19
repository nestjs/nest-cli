export class ReaderFileLackPermissionsError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly fsErrorCode: string,
  ) {
    super(`File ${filePath} lacks read permissions!`);
  }
}

export interface Reader {
  list(): string[];
  read(name: string): string;
  readAnyOf(
    filenames: string[],
  ): string | undefined | ReaderFileLackPermissionsError;
}
