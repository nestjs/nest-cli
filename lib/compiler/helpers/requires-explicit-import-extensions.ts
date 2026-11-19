import * as ts from 'typescript';
import { getComputedOptionValue } from './get-computed-options.js';

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
  const moduleResolution = getComputedOptionValue(
    options,
    'moduleResolution',
    tsBinary,
  );
  return (
    moduleResolution === tsBinary.ModuleResolutionKind.Node16 ||
    moduleResolution === tsBinary.ModuleResolutionKind.NodeNext
  );
}
