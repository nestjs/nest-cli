export interface Generator {
  generate(name: string): Promise<void>
}
