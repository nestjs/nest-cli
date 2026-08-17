export interface NewCommandContext {
  name?: string;
  directory?: string;
  dryRun: boolean;
  skipGit: boolean;
  skipInstall: boolean;
  skipTests: boolean;
  packageManager?: string;
  language: string;
  collection: string;
  strict: boolean;
  format: boolean;
  /**
   * Whether to auto-configure `@nestjs/observe`. Left `undefined` when the
   * user passed neither `--observe` nor `--no-observe`, so the action knows it
   * still has to ask.
   */
  observe?: boolean;
}
