export interface UnusedRoutesCommandContext {
  /** GitHub URL of the frontend repository to scan. Required. */
  frontendUrl: string;
  /** GitHub Personal Access Token for private repositories. */
  token?: string;
  /** Branch to scan. Defaults to the repo's default branch. */
  branch?: string;
  /** Output format: table | json | markdown */
  format: 'table' | 'json' | 'markdown';
  /** Write report to this file path instead of stdout. */
  output?: string;
  /** Only include routes with these path prefixes. */
  include?: string[];
  /** Exclude routes with these path prefixes. */
  exclude?: string[];
  /** Exit with code 1 if risk reaches this level. */
  failOn: 'medium' | 'high' | 'critical';
  /** Override the sourceRoot from nest-cli.json. */
  sourceRoot?: string;
}
