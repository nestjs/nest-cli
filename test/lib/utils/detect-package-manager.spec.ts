import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackageManager } from '../../../lib/package-managers/package-manager.js';
import { detectPackageManager } from '../../../lib/utils/detect-package-manager.js';

describe('detectPackageManager', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['npm/11.19.0 node/v24.20.0 darwin arm64', PackageManager.NPM],
    ['pnpm/10.4.0 npm/? node/v24.20.0 darwin arm64', PackageManager.PNPM],
    ['yarn/4.9.1 npm/? node/v24.20.0 darwin arm64', PackageManager.YARN],
    ['bun/1.3.0 npm/? node/v24.20.0 darwin arm64', PackageManager.BUN],
  ])('reads %s', (userAgent, expected) => {
    vi.stubEnv('npm_config_user_agent', userAgent);

    expect(detectPackageManager()).toBe(expected);
  });

  it('falls back to npm when nothing started the process', () => {
    vi.stubEnv('npm_config_user_agent', undefined);

    expect(detectPackageManager()).toBe(PackageManager.NPM);
  });

  it('falls back to npm for a package manager it cannot drive', () => {
    vi.stubEnv('npm_config_user_agent', 'cnpm/9.0.0 node/v24.20.0');

    expect(detectPackageManager()).toBe(PackageManager.NPM);
  });
});
