export interface AddCommandContext {
  library: string;
  dryRun: boolean;
  skipInstall: boolean;
  project?: string;
  extraFlags: string[];
}
