export interface Repository {
  clone(): Promise<void>
}
