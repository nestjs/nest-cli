export const CLI_ERRORS = {
  MISSING_TYPESCRIPT: (path: string) =>
    `Could not find TypeScript configuration file "${path}". Please, ensure that you are running this command in the appropriate directory (inside Nest workspace).`,
  WRONG_PLUGIN: (name: string) =>
    `The "${name}" plugin is not compatible with Nest CLI. Neither "after()" nor "before()" nor "afterDeclarations()" function have been provided.`,
  UNSUPPORTED_TYPESCRIPT_VERSION: (version: string) =>
    `The installed TypeScript version (${version}) does not expose a programmatic compiler API that the Nest CLI can use. TypeScript 7.0 ships the "tsc" executable only; TypeScript 7.1+ exposes the native API ("typescript/unstable/sync") that the "tsc" builder supports. Please install TypeScript 7.1 or newer, or TypeScript 6 (e.g. "npm i -D typescript@^6").`,
  PLUGINS_UNSUPPORTED_ON_NATIVE_TYPESCRIPT: (plugins: string[]) =>
    `Compiler plugins (${plugins.map((name) => `"${name}"`).join(', ')}) run as TypeScript transformers, which the native TypeScript 7 compiler API does not expose yet. Remove "compilerOptions.plugins" from nest-cli.json, or install TypeScript 6 side-by-side ("typescript": "npm:@typescript/typescript6@^6") until plugin support lands.`,
  CLASSIC_API_REQUIRED_ON_NATIVE_TYPESCRIPT: (version: string) =>
    `The installed TypeScript version (${version}) only exposes the native compiler API. The "tsc" builder supports it, but compiler plugins, the "swc" builder with "typeCheck", and the "webpack"/"rspack" builders still require the classic compiler API. Please use the "tsc" builder without plugins, or install TypeScript 6 (e.g. "npm i -D typescript@^6") for those features.`,
};
