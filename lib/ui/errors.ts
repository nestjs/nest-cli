export const CLI_ERRORS = {
  MISSING_TYPESCRIPT: (path: string) =>
    `Could not find TypeScript configuration file "${path}". Please, ensure that you are running this command in the appropriate directory (inside Nest workspace).`,
  WRONG_PLUGIN: (name: string) =>
    `The "${name}" plugin is not compatible with Nest CLI. Neither "after()" nor "before()" nor "afterDeclarations()" function have been provided.`,
  UNSUPPORTED_TYPESCRIPT_VERSION: (version: string) =>
    `The installed TypeScript version (${version}) does not expose the programmatic compiler API that the Nest CLI requires. TypeScript 7.0 ships the "tsc" executable only; the compiler API is expected to return in 7.1. Please install TypeScript 6 (e.g. "npm i -D typescript@^6") until then.`,
};
