import { PackageManager } from '../package-managers/package-manager.js';

/**
 * The package manager that started this process, or npm when none did.
 *
 * `npx`, `pnpm dlx`, `yarn dlx` and `bunx` all say who they are in
 * `npm_config_user_agent` (for example `pnpm/10.4.0 npm/? node/v24.0.0`).
 */
export function detectPackageManager(): PackageManager {
  const name = process.env.npm_config_user_agent?.split('/')[0];
  const managers: string[] = Object.values(PackageManager);
  return managers.includes(name as string)
    ? (name as PackageManager)
    : PackageManager.NPM;
}
