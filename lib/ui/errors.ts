// tslint:disable:max-line-length

export const CLI_ERRORS = {
  MISSING_TYPESCRIPT: (path: string) =>
    `Could not find TypeScript configuration file "${path}". Please, ensure that you are running this command in the appropriate directory (inside Nest workspace).`,
  WRONG_PLUGIN: (name: string) =>
    `The "${name}" plugin is not compatible with Nest CLI. Neither "after()" nor "before()" nor "afterDeclarations()" function have been provided.`,
  PROJECT_NOT_FOUND: (name: string) =>
    `Error: The project directory '${name}' does not exist.`,
  ACTION_CANCELLED: 'Action Cancelled',
  REMOVE_ACTION_NOT_SUPPORTED:
    'This command line utility is supported in monorepo projects only.',
  REMOVE_ACTION_FAILURE_FOR_ROOT_APPLICATION:
    'Cannot remove the root application.',
  REMOVE_ACTION_FAILED: 'Failed to remove application.',
  REMOVE_ACTION_NEST_CLI_JSON_UPDATE_FAILED: 'Failed to update nest-cli.json.',
  REMOVE_ACTION_NEST_CLI_JSON_NOT_FOUND: 'Failed to read nest-cli.json',
};
