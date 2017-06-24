export interface ModuleFinder {
  find(moduleName: string): Promise<string>;
}
