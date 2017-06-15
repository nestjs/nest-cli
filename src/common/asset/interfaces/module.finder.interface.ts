export interface ModuleFinder {
  findFrom(origin: string): Promise<string>
}
