import { existsSync, readdirSync, readFileSync } from 'fs';
import { builtinModules } from 'module';
import { dirname, isAbsolute, join } from 'path';
import { INFO_PREFIX } from '../../ui/index.js';

/**
 * Packages that Nest and its ecosystem import lazily and that apps are not
 * required to install. In a bundle they are only ignored when they do not
 * resolve from the project, so installed ones are still bundled.
 */
export const optionalPackages = [
  '@fastify/multipart',
  '@fastify/static',
  '@grpc/grpc-js',
  '@grpc/proto-loader',
  '@mikro-orm/core',
  '@nats-io/transport-node',
  '@nestjs/axios',
  '@nestjs/microservices',
  '@nestjs/mongoose',
  '@nestjs/platform-express',
  '@nestjs/platform-socket.io',
  '@nestjs/sequelize',
  '@nestjs/websockets',
  'amqp-connection-manager',
  'amqplib',
  'class-transformer',
  'class-validator',
  'file-type',
  'ioredis',
  'kafkajs',
  'mqtt',
  'pkg',
];

/**
 * Packages whose files are read from disk at runtime instead of imported
 * (`@nestjs/swagger` serves the Swagger UI from `swagger-ui-dist`), so they
 * stay external like native addons.
 */
export const runtimeFilePackages = ['swagger-ui-dist'];

export interface ExternalPackage {
  name: string;
  version: string;
}

/**
 * Returns the package name of a bare request (`@scope/name/sub` becomes
 * `@scope/name`), or undefined for relative, absolute and `node:` requests.
 */
export function getPackageName(request: string): string | undefined {
  if (
    request.startsWith('.') ||
    request.startsWith('node:') ||
    isAbsolute(request)
  ) {
    return undefined;
  }
  const parts = request.split('/');
  return request.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/**
 * Finds the directory of an installed package by walking up the
 * `node_modules` folders, like the Node resolver does.
 */
export function findPackageDir(name: string, from: string): string | undefined {
  let dir = from;
  for (;;) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

/**
 * True when the request is a known optional package that is not installed.
 * Unlike `require.resolve`, it does not depend on the package `exports`
 * conditions, which matters for ESM-only packages.
 */
export function isMissingOptionalPackage(
  request: string,
  cwd = process.cwd(),
): boolean {
  const name = getPackageName(request);
  if (!name || !optionalPackages.includes(name)) {
    return false;
  }
  return !findPackageDir(name, cwd);
}

function readPackageJson(dir: string): Record<string, any> | undefined {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  } catch {
    return undefined;
  }
}

function hasNodeFile(dir: string, depth = 4): boolean {
  if (depth === 0) {
    return false;
  }
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  return entries.some((entry) =>
    entry.isDirectory()
      ? entry.name !== 'node_modules' &&
        hasNodeFile(join(dir, entry.name), depth - 1)
      : entry.name.endsWith('.node'),
  );
}

function isNativePackage(dir: string, pkg: Record<string, any>): boolean {
  return (
    pkg.gypfile === true ||
    existsSync(join(dir, 'binding.gyp')) ||
    hasNodeFile(dir)
  );
}

/**
 * Walks the installed production dependency graph of the project and returns
 * the packages that cannot be bundled and must stay external: the ones that
 * ship a native addon (`binding.gyp`, `gypfile` or `.node` files), the
 * `runtimeFilePackages` and the excluded ones.
 */
export function findExternalPackages(
  cwd = process.cwd(),
  exclude: string[] = [],
): ExternalPackage[] {
  const root = readPackageJson(cwd);
  if (!root) {
    return [];
  }
  const externalPackages = new Map<string, ExternalPackage>();
  const visited = new Set<string>();
  const queue: Array<{ names: string[]; from: string }> = [
    {
      names: Object.keys({
        ...root.dependencies,
        ...root.optionalDependencies,
      }),
      from: cwd,
    },
  ];
  while (queue.length) {
    const { names, from } = queue.shift()!;
    for (const name of names) {
      const dir = findPackageDir(name, from);
      if (!dir || visited.has(dir)) {
        continue;
      }
      visited.add(dir);
      const pkg = readPackageJson(dir);
      if (!pkg) {
        continue;
      }
      if (
        exclude.includes(name) ||
        runtimeFilePackages.includes(name) ||
        isNativePackage(dir, pkg)
      ) {
        externalPackages.set(name, { name, version: pkg.version });
        continue;
      }
      queue.push({
        names: Object.keys({
          ...pkg.dependencies,
          ...pkg.optionalDependencies,
        }),
        from: dir,
      });
    }
  }
  return [...externalPackages.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Externals for a bundle that contains its dependencies: Node builtins and
 * the external packages only. Both are loaded with `require`, because dependencies
 * that are CommonJS call `require('stream')` and expect the module itself,
 * which an ESM `import` external would not give them.
 */
export function createBundleExternals(
  isEsm: boolean,
  externalPackages: ExternalPackage[],
) {
  const externalNames = new Set(externalPackages.map(({ name }) => name));
  const type = isEsm ? 'node-commonjs' : 'commonjs';
  return (
    { request }: { request?: string },
    callback: (error?: Error | null, result?: string) => void,
  ) => {
    if (!request) {
      return callback();
    }
    const isBuiltin =
      request.startsWith('node:') || builtinModules.includes(request);
    const name = getPackageName(request);
    if (isBuiltin || (name && externalNames.has(name))) {
      return callback(null, `${type} ${request}`);
    }
    callback();
  };
}

export interface BundleDependenciesPluginOptions {
  isEsm: boolean;
  externalPackages: ExternalPackage[];
  /** Collects the optional packages that were ignored in this compilation. */
  ignored: Set<string>;
}

/**
 * Emits a `package.json` next to the bundle with the external packages pinned to
 * the installed versions and a `type` matching the output, and reports what
 * was stubbed and kept external.
 */
export class BundleDependenciesPlugin {
  constructor(private readonly options: BundleDependenciesPluginOptions) {}

  apply(compiler: any) {
    const { isEsm, externalPackages, ignored } = this.options;
    const name = 'NestBundleDependenciesPlugin';
    const { Compilation, sources } = compiler.rspack;

    compiler.hooks.thisCompilation.tap(name, (compilation: any) => {
      ignored.clear();
      compilation.hooks.processAssets.tap(
        { name, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        () => {
          const manifest = {
            private: true,
            type: isEsm ? 'module' : 'commonjs',
            dependencies: Object.fromEntries(
              externalPackages.map((pkg) => [pkg.name, pkg.version]),
            ),
          };
          compilation.emitAsset(
            'package.json',
            new sources.RawSource(JSON.stringify(manifest, null, 2) + '\n'),
          );
        },
      );
    });

    compiler.hooks.done.tap(name, (stats: any) => {
      if (stats.hasErrors()) {
        return;
      }
      const list = (items: string[]) => (items.length ? items.join(', ') : '-');
      console.log(
        `${INFO_PREFIX} Dependencies are bundled.\n` +
          `  optional packages not installed, ignored: ${list([...ignored].sort())}\n` +
          `  packages kept external, pinned in package.json: ${list(
            externalPackages.map(({ name, version }) => `${name}@${version}`),
          )}\n` +
          `  run "npm install --omit=dev" in the output directory to install them`,
      );
    });
  }
}
