export const CLI_ERRORS = {
  MISSING_TYPESCRIPT: (path: string) =>
    `Could not find TypeScript configuration file "${path}". Please, ensure that you are running this command in the appropriate directory (inside Nest workspace).`,
  WRONG_PLUGIN: (name: string) =>
    `The "${name}" plugin is not compatible with Nest CLI. Neither "after()" nor "before()" nor "afterDeclarations()" function have been provided.`,
  UNSUPPORTED_TYPESCRIPT_VERSION: (version: string) =>
    `The installed TypeScript version (${version}) does not expose the programmatic compiler API that the Nest CLI requires. To use TypeScript 7 alongside Nest CLI, install the TypeScript 6 compatibility package as the "typescript" alias (e.g. "npm i -D typescript@npm:@typescript/typescript6@^6.0.2"). TypeScript 7 can remain installed separately as "@typescript/native" and provide the "tsc" executable.`,
};
