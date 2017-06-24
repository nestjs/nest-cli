export interface ModuleFinder {
  find(module?: string): Promise<string>;
  findFrom(origin: string): Promise<string>
}
