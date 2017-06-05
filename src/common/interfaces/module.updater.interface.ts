export interface ModuleUpdater {
  update(className): Promise<void>
}
