export interface DeployCommandContext {
  /**
   * Arguments forwarded verbatim to `mau deploy`, so every option Mau
   * supports keeps working without the CLI having to mirror it.
   */
  args: string[];
}
