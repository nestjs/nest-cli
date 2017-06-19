export interface Processor {
  process(): Promise<void>
}
