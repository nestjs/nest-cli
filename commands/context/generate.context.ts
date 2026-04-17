export interface GenerateCommandContext {
  schematic: string;
  name?: string;
  path?: string;
  dryRun: boolean;
  flat?: boolean;
  spec: boolean | { value: boolean; passedAsInput: boolean };
  specFileSuffix?: string;
  collection?: string;
  project?: string;
  skipImport: boolean;
  format: boolean;
  type?: string;
  crud?: boolean;
}
