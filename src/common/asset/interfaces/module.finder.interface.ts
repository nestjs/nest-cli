export interface ModuleFinder {
  find(moduleName: string): Promise<string>;
  findFrom(origin: string): Promise<string>
}
