export interface NewCommandContext {
  name?: string;
  directory?: string;
  dryRun: boolean;
  skipGit: boolean;
  skipInstall: boolean;
  packageManager?: string;
  language: string;
  collection: string;
  strict: boolean;
}
