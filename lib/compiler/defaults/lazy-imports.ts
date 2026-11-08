import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Optional imports that bundlers must not fail on when the package is not
 * installed. Nest 12 imports its own submodules with a `.js` suffix, older
 * releases without it, so both forms are listed.
 */
export const lazyImports = [
  '@nestjs/microservices',
  '@nestjs/microservices/microservices-module',
  '@nestjs/microservices/microservices-module.js',
  '@nestjs/websockets/socket-module',
  '@nestjs/websockets/socket-module.js',
  'class-validator',
  'class-transformer',
  'class-transformer/storage',
];

/**
 * True when the resource is a lazy import that does not resolve from the
 * current working directory.
 */
export function isMissingLazyImport(resource: string): boolean {
  if (!lazyImports.includes(resource)) {
    return false;
  }
  try {
    require.resolve(resource, {
      paths: [process.cwd()],
    });
  } catch {
    return true;
  }
  return false;
}
