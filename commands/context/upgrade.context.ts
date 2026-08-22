export interface UpgradeCommandContext {
  dryRun: boolean;
  skipInstall: boolean;
  /**
   * Tri-state on purpose: `undefined` means neither `--observe` nor
   * `--no-observe` was passed, which lets the schematic's own `x-prompt` ask.
   */
  observe?: boolean;
  tag?: string;
  collection?: string;
}
