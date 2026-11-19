import * as ts from 'typescript';

/**
 * Returns `true` when the consuming project uses an ESM-style module
 * resolution strategy (`node16` / `nodenext`). Under those resolution
 * modes, dynamic `import()` specifiers MUST include the file extension
 * (typically `.js`) for the runtime resolver to find the module. Without
 * the extension, executing the generated metadata file fails with
 * `ERR_MODULE_NOT_FOUND`, and TypeScript reports a diagnostic.
 *
 * The resolution strategy is the one the compiler uses, so a tsconfig that
 * sets `module: nodenext` and omits `moduleResolution` counts as NodeNext.
 */
export function requiresExplicitImportExtensions(
  options: ts.CompilerOptions,
  tsBinary: typeof ts,
): boolean {
  const moduleResolution = getModuleResolution(options, tsBinary);
  return (
    moduleResolution === tsBinary.ModuleResolutionKind.Node16 ||
    moduleResolution === tsBinary.ModuleResolutionKind.NodeNext
  );
}

/**
 * `getParsedCommandLineOfConfigFile()` leaves an omitted `moduleResolution`
 * undefined, while the compiler computes it from `module`. That computation,
 * `getEmitModuleResolutionKind()`, is internal, so a TypeScript without it
 * falls back to the option as written.
 */
function getModuleResolution(
  options: ts.CompilerOptions,
  tsBinary: typeof ts,
): ts.ModuleResolutionKind | undefined {
  const { getEmitModuleResolutionKind } = tsBinary as typeof ts & {
    getEmitModuleResolutionKind?: (
      options: ts.CompilerOptions,
    ) => ts.ModuleResolutionKind;
  };
  return typeof getEmitModuleResolutionKind === 'function'
    ? getEmitModuleResolutionKind(options)
    : options.moduleResolution;
}
