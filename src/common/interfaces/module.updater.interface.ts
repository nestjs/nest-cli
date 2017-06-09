export interface ModuleUpdater {
  update(filename: string, className: string): Promise<void>
}
