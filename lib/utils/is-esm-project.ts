import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Detect whether the target project uses ESM output.
 * Checks the project's package.json for `"type": "module"`.
 */
export function isEsmProject(cwd: string = process.cwd()): boolean {
  try {
    const raw = readFileSync(join(cwd, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    return pkg.type === 'module';
  } catch {
    return false;
  }
}
