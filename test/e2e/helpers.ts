import { ChildProcess, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = path.resolve(__dirname, '..', '..', 'bin', 'nest.js');

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;
function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '');
}

/**
 * Run a nest CLI command synchronously and return stdout.
 */
export function runNest(
  args: string,
  cwd?: string,
  env?: NodeJS.ProcessEnv,
): string {
  const command = `node "${CLI_PATH}" ${args}`;
  try {
    return stripAnsi(
      execSync(command, {
        cwd: cwd ?? process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, ...env },
        timeout: 120_000,
      }),
    );
  } catch (err: any) {
    // execSync errors only carry the command in their message; surface the
    // CLI's actual output so failures are diagnosable from CI logs.
    err.message += `\n--- stdout ---\n${stripAnsi(err.stdout?.toString() ?? '')}\n--- stderr ---\n${stripAnsi(err.stderr?.toString() ?? '')}`;
    throw err;
  }
}

/**
 * Run a nest CLI command and return both stdout and stderr.
 */
export function runNestRaw(
  args: string,
  cwd?: string,
): { stdout: string; stderr: string; exitCode: number } {
  const command = `node "${CLI_PATH}" ${args}`;
  try {
    const stdout = execSync(command, {
      cwd: cwd ?? process.cwd(),
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: stripAnsi(stdout), stderr: '', exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: stripAnsi(err.stdout?.toString() ?? ''),
      stderr: stripAnsi(err.stderr?.toString() ?? ''),
      exitCode: err.status ?? 1,
    };
  }
}

/**
 * Start a nest CLI command as a background process.
 * Returns the child process and utility methods.
 */
export function spawnNest(
  args: string,
  cwd?: string,
  env?: NodeJS.ProcessEnv,
  cliPath?: string,
): { child: ChildProcess; output: () => string; kill: () => void } {
  const child = spawn('node', [cliPath ?? CLI_PATH, ...args.split(/\s+/)], {
    cwd: cwd ?? process.cwd(),
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true, // create a process group so we can kill the full tree
  });

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (d) => (stdout += stripAnsi(d.toString())));
  child.stderr?.on('data', (d) => (stderr += stripAnsi(d.toString())));

  return {
    child,
    output: () => stdout + stderr,
    kill: () => {
      try {
        // Kill the entire process group (CLI + child compilers/servers)
        process.kill(-child.pid!, 'SIGTERM');
      } catch {}
      // Send SIGKILL synchronously to ensure cleanup even if the test
      // process exits immediately after this call.
      try {
        execSync(`kill -9 -${child.pid!} 2>/dev/null || true`, {
          timeout: 3000,
          stdio: 'ignore',
        });
      } catch {}
    },
  };
}

/**
 * Kill any process listening on a given port. Useful for cleaning up
 * stale processes left behind by previous test runs.
 */
export function freePort(port: number): void {
  try {
    const out = execSync(`lsof -ti :${port}`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (out) {
      execSync(`kill -9 ${out.split('\n').join(' ')}`, {
        timeout: 3000,
        stdio: 'ignore',
      });
    }
  } catch {}
}

/**
 * Create a unique temporary directory for test isolation.
 */
export function createTempDir(prefix = 'nest-e2e-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * Recursively remove a directory.
 */
export function removeTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

/**
 * Check if a file exists.
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Read file contents.
 */
export function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Wait for a condition to be true (polling). Supports both sync and async conditions.
 */
export function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 30_000,
  intervalMs = 500,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = async () => {
      try {
        if (await condition()) {
          resolve();
          return;
        }
      } catch {
        // condition threw — treat as false
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`waitFor timed out after ${timeoutMs}ms`));
      } else {
        setTimeout(check, intervalMs);
      }
    };
    check();
  });
}

/**
 * Connection errors that mean "the server is not accepting connections yet",
 * as opposed to a genuine failure. Under CI load the socket can still be
 * unavailable for a short moment after the app logged that it started, and a
 * watch-mode restart tears the listener down between requests.
 */
const TRANSIENT_CONNECTION_ERRORS = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ECONNABORTED',
  'EPIPE',
];

function isTransientConnectionError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return !!code && TRANSIENT_CONNECTION_ERRORS.includes(code);
}

function httpGetOnce(
  url: string,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timed out'));
    });
  });
}

/**
 * Make an HTTP GET request and return the response body. Transient connection
 * errors are retried until `retryForMs` elapses, so callers don't have to race
 * the server's startup (or a watch-mode restart) themselves.
 */
export async function httpGet(
  url: string,
  timeoutMs = 5000,
  retryForMs = 10_000,
  retryIntervalMs = 250,
): Promise<{ status: number; body: string }> {
  const deadline = Date.now() + retryForMs;
  for (;;) {
    try {
      return await httpGetOnce(url, timeoutMs);
    } catch (error) {
      if (!isTransientConnectionError(error) || Date.now() >= deadline) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, retryIntervalMs));
    }
  }
}

/**
 * Scaffold a new NestJS app (skipping install & git) and return its path.
 */
export function scaffoldApp(
  tmpDir: string,
  appName: string,
  extraFlags = '',
): string {
  runNest(
    `new ${appName} --skip-install --skip-git -p npm ${extraFlags}`,
    tmpDir,
  );
  return path.join(tmpDir, appName);
}

/**
 * Scaffold an app and install its dependencies. Returns the project path.
 * This is expensive (~30s) so use sparingly and share across tests when possible.
 */
export function scaffoldAppWithDeps(
  tmpDir: string,
  appName: string,
  extraFlags = '',
): string {
  const appPath = scaffoldApp(tmpDir, appName, extraFlags);
  npmInstall(appPath);
  return appPath;
}

/**
 * Run `npm install` in the given app.
 *
 * - Uses a private npm cache (a sibling of the app, removed with the temp
 *   dir) so parallel test files never contend on the shared `~/.npm`.
 * - Skips audit/fund, which shrinks the surface for npm-internal crashes.
 * - Uses --legacy-peer-deps: the v12 alpha packages on the `next` dist-tag
 *   still declare `^11.0.0` peer ranges (e.g. @nestjs/core@12.0.0-alpha.6 →
 *   @nestjs/common@^11.0.0), and that unsatisfiable conflict crashes npm's
 *   resolver outright ("Cannot read properties of null (reading 'children')"
 *   in Arborist's PlaceDep, npm 11.17). Remove the flag once the alphas ship
 *   correct peer ranges.
 * - Retries once from a clean slate, and attaches the npm debug log to the
 *   thrown error so CI failures show npm's actual stack trace instead of a
 *   one-line message.
 */
export function npmInstall(appPath: string, args = ''): void {
  const cacheDir = `${appPath}-npm-cache`;
  const maxAttempts = 2;
  for (let attempt = 1; ; attempt++) {
    try {
      execSync(
        `npm install --no-audit --no-fund --legacy-peer-deps ${args}`.trimEnd(),
        {
          cwd: appPath,
          encoding: 'utf-8',
          timeout: 120_000,
          stdio: 'pipe',
          env: { ...process.env, npm_config_cache: cacheDir },
        },
      );
      return;
    } catch (error: any) {
      if (attempt >= maxAttempts) {
        error.message += `\n--- npm debug log ---\n${readNewestNpmLog(cacheDir)}`;
        throw error;
      }
      // Retry from a clean slate.
      fs.rmSync(cacheDir, { recursive: true, force: true });
      fs.rmSync(path.join(appPath, 'node_modules'), {
        recursive: true,
        force: true,
      });
    }
  }
}

/** Read the tail of the most recent npm debug log in the given cache dir. */
function readNewestNpmLog(cacheDir: string): string {
  try {
    const logsDir = path.join(cacheDir, '_logs');
    const newest = fs
      .readdirSync(logsDir)
      .sort()
      .at(-1);
    if (!newest) return '(no log files found)';
    const content = fs.readFileSync(path.join(logsDir, newest), 'utf-8');
    return content.split('\n').slice(-80).join('\n');
  } catch (e) {
    return `(could not read npm log: ${e})`;
  }
}

/**
 * Scaffold a monorepo with a sub-app, install deps, and return the root path.
 * Manually constructs the monorepo layout because `nest generate app` is
 * unreliable when invoked from a Jest child process (the schematics-cli
 * skips file-move operations when stdin is piped and non-interactive).
 */
export function scaffoldMonorepoWithDeps(
  tmpDir: string,
  mainAppName: string,
  subAppName: string,
): string {
  const appPath = scaffoldAppWithDeps(tmpDir, mainAppName);

  // Move src/ → apps/<mainApp>/src/ and test/ → apps/<mainApp>/test/
  const mainAppRoot = path.join(appPath, 'apps', mainAppName);
  fs.mkdirSync(path.join(mainAppRoot, 'src'), { recursive: true });
  for (const f of fs.readdirSync(path.join(appPath, 'src'))) {
    fs.renameSync(
      path.join(appPath, 'src', f),
      path.join(mainAppRoot, 'src', f),
    );
  }
  fs.rmSync(path.join(appPath, 'src'), { recursive: true });

  if (fs.existsSync(path.join(appPath, 'test'))) {
    fs.mkdirSync(path.join(mainAppRoot, 'test'), { recursive: true });
    for (const f of fs.readdirSync(path.join(appPath, 'test'))) {
      fs.renameSync(
        path.join(appPath, 'test', f),
        path.join(mainAppRoot, 'test', f),
      );
    }
    fs.rmSync(path.join(appPath, 'test'), { recursive: true });
  }

  // Create apps/<mainApp>/tsconfig.app.json
  writeFileContent(
    path.join(mainAppRoot, 'tsconfig.app.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: {
          declaration: false,
          // TypeScript 6 (TS5011) requires an explicit rootDir
          rootDir: 'src',
          outDir: `../../dist/apps/${mainAppName}`,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'test', '**/*spec.ts'],
      },
      null,
      2,
    ),
  );

  // Create secondary app source files
  const subAppRoot = path.join(appPath, 'apps', subAppName);
  const capitalizedSub =
    subAppName.charAt(0).toUpperCase() + subAppName.slice(1);

  writeFileContent(
    path.join(subAppRoot, 'src', 'main.ts'),
    `import { NestFactory } from '@nestjs/core';\nimport { ${capitalizedSub}Module } from './${subAppName}.module';\n\nasync function bootstrap() {\n  const app = await NestFactory.create(${capitalizedSub}Module);\n  await app.listen(process.env.PORT ?? 3000);\n}\nbootstrap();\n`,
  );
  writeFileContent(
    path.join(subAppRoot, 'src', `${subAppName}.module.ts`),
    `import { Module } from '@nestjs/common';\nimport { ${capitalizedSub}Controller } from './${subAppName}.controller';\nimport { ${capitalizedSub}Service } from './${subAppName}.service';\n\n@Module({\n  imports: [],\n  controllers: [${capitalizedSub}Controller],\n  providers: [${capitalizedSub}Service],\n})\nexport class ${capitalizedSub}Module {}\n`,
  );
  writeFileContent(
    path.join(subAppRoot, 'src', `${subAppName}.controller.ts`),
    `import { Controller, Get } from '@nestjs/common';\nimport { ${capitalizedSub}Service } from './${subAppName}.service';\n\n@Controller()\nexport class ${capitalizedSub}Controller {\n  constructor(private readonly ${subAppName}Service: ${capitalizedSub}Service) {}\n\n  @Get()\n  getHello(): string {\n    return this.${subAppName}Service.getHello();\n  }\n}\n`,
  );
  writeFileContent(
    path.join(subAppRoot, 'src', `${subAppName}.service.ts`),
    `import { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class ${capitalizedSub}Service {\n  getHello(): string {\n    return 'Hello from ${subAppName}!';\n  }\n}\n`,
  );

  // Create apps/<subApp>/tsconfig.app.json
  writeFileContent(
    path.join(subAppRoot, 'tsconfig.app.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: {
          declaration: false,
          // TypeScript 6 (TS5011) requires an explicit rootDir
          rootDir: 'src',
          outDir: `../../dist/apps/${subAppName}`,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'test', '**/*spec.ts'],
      },
      null,
      2,
    ),
  );

  // Write monorepo nest-cli.json
  writeFileContent(
    path.join(appPath, 'nest-cli.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/nest-cli',
        collection: '@nestjs/schematics',
        sourceRoot: `apps/${mainAppName}/src`,
        compilerOptions: {
          deleteOutDir: true,
          webpack: true,
          tsConfigPath: `apps/${mainAppName}/tsconfig.app.json`,
        },
        monorepo: true,
        root: `apps/${mainAppName}`,
        projects: {
          [mainAppName]: {
            type: 'application',
            root: `apps/${mainAppName}`,
            entryFile: 'main',
            sourceRoot: `apps/${mainAppName}/src`,
            compilerOptions: {
              tsConfigPath: `apps/${mainAppName}/tsconfig.app.json`,
            },
          },
          [subAppName]: {
            type: 'application',
            root: `apps/${subAppName}`,
            entryFile: 'main',
            sourceRoot: `apps/${subAppName}/src`,
            compilerOptions: {
              tsConfigPath: `apps/${subAppName}/tsconfig.app.json`,
            },
          },
        },
      },
      null,
      2,
    ),
  );

  // Update root tsconfig.json to remove "paths" if needed
  const rootTsconfig = JSON.parse(
    fs.readFileSync(path.join(appPath, 'tsconfig.json'), 'utf-8'),
  );
  if (!rootTsconfig.compilerOptions.paths) {
    rootTsconfig.compilerOptions.paths = {};
  }
  fs.writeFileSync(
    path.join(appPath, 'tsconfig.json'),
    JSON.stringify(rootTsconfig, null, 2),
  );

  return appPath;
}

/**
 * Write content to a file, creating directories as needed.
 */
export function writeFileContent(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Convert a scaffolded ESM NestJS app back to CJS.
 *
 * 1. Removes `"type": "module"` from package.json
 * 2. Replaces top-level `await bootstrap()` with `bootstrap()` in main.ts
 * 3. Strips `.js` extensions from relative imports in `.ts` source files
 */
export function convertToCjs(appPath: string): void {
  // 1. Remove "type": "module" from package.json
  const pkgPath = path.join(appPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  delete pkg.type;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Collect all .ts source directories
  const srcDirs: string[] = [];
  const rootSrc = path.join(appPath, 'src');
  if (fs.existsSync(rootSrc)) srcDirs.push(rootSrc);
  const appsDir = path.join(appPath, 'apps');
  if (fs.existsSync(appsDir)) {
    for (const dir of fs.readdirSync(appsDir)) {
      const appSrc = path.join(appsDir, dir, 'src');
      if (fs.existsSync(appSrc)) srcDirs.push(appSrc);
    }
  }

  // 2. Replace top-level await bootstrap() in main.ts files
  // 3. Strip .js extensions from relative imports
  for (const srcDir of srcDirs) {
    const tsFiles = fs
      .readdirSync(srcDir, { recursive: true })
      .filter((f): f is string => typeof f === 'string' && f.endsWith('.ts'));

    for (const file of tsFiles) {
      const filePath = path.join(srcDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      // Strip .js from relative imports: './foo.js' → './foo'
      content = content.replace(
        /(from\s+['"]\.\.?\/[^'"]*?)\.js(['"])/g,
        '$1$2',
      );
      // Replace top-level await bootstrap()
      content = content.replace(/^await (bootstrap\(\));?$/m, '$1;');
      fs.writeFileSync(filePath, content);
    }
  }
}

/**
 * Install the optional webpack peer dependencies that `@nestjs/cli` needs for
 * webpack-based builds. The published CLI marks these as optional, so they are
 * not installed automatically.
 */
export function installWebpackDeps(appPath: string): void {
  npmInstall(
    appPath,
    '--save-dev ts-loader webpack webpack-node-externals tsconfig-paths-webpack-plugin fork-ts-checker-webpack-plugin',
  );
}

/**
 * Convert a scaffolded CJS NestJS app into an ESM project.
 *
 * 1. Adds `"type": "module"` to package.json
 * 2. Appends `.js` extensions to all relative imports in `.ts` source files
 * 3. Rewrites main.ts to use top-level `await` (validates ESM TLA support)
 */
export function convertToEsm(appPath: string): void {
  // 1. Add "type": "module" to package.json
  const pkgPath = path.join(appPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.type = 'module';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // 2. Add .js extensions to relative imports in all .ts files under src/
  const srcDir = path.join(appPath, 'src');
  const tsFiles = fs
    .readdirSync(srcDir, { recursive: true })
    .filter((f): f is string => typeof f === 'string' && f.endsWith('.ts'));

  for (const file of tsFiles) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    // Match `from './foo'` or `from '../foo'` and append .js
    content = content.replace(
      /(from\s+['"])(\.\.?\/[^'"]+?)(?<!\.js)(['"])/g,
      '$1$2.js$3',
    );
    fs.writeFileSync(filePath, content);
  }

  // 3. Rewrite main.ts to use top-level await
  const mainPath = path.join(srcDir, 'main.ts');
  const mainContent = `\
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const app = await NestFactory.create(AppModule);
await app.listen(process.env.PORT ?? 3000);
`;
  fs.writeFileSync(mainPath, mainContent);
}

/**
 * Scaffold an ESM NestJS app with dependencies installed.
 * Wraps scaffoldAppWithDeps + convertToEsm.
 */
export function scaffoldEsmAppWithDeps(
  tmpDir: string,
  appName: string,
): string {
  const appPath = scaffoldAppWithDeps(tmpDir, appName);
  convertToEsm(appPath);
  return appPath;
}

/**
 * Enable the webpack compiler in a scaffolded project's nest-cli.json.
 */
export function enableWebpack(appPath: string): void {
  const cliJsonPath = path.join(appPath, 'nest-cli.json');
  const cliJson = JSON.parse(fs.readFileSync(cliJsonPath, 'utf-8'));
  cliJson.compilerOptions = {
    ...cliJson.compilerOptions,
    webpack: true,
  };
  fs.writeFileSync(cliJsonPath, JSON.stringify(cliJson, null, 2));
}

/**
 * Enable the rspack builder in a scaffolded project's nest-cli.json.
 *
 * The rspack dependencies (@rspack/core, webpack-node-externals, etc.) are
 * resolved from the CLI's own node_modules via createRequire(import.meta.url),
 * so they don't need to be installed in the project itself.
 */
export function enableRspack(appPath: string): void {
  const cliJsonPath = path.join(appPath, 'nest-cli.json');
  const cliJson = JSON.parse(fs.readFileSync(cliJsonPath, 'utf-8'));
  cliJson.compilerOptions = {
    ...cliJson.compilerOptions,
    builder: 'rspack',
  };
  fs.writeFileSync(cliJsonPath, JSON.stringify(cliJson, null, 2));
}

/**
 * Remove the locally installed @nestjs/cli from a scaffolded project.
 *
 * The CLI entry-point (`bin/nest.js`) delegates to a project-local
 * `node_modules/@nestjs/cli` when it exists. For e2e tests that need to
 * exercise the *development* version of the CLI we must remove the published
 * copy so that `localBinExists()` returns false.
 */
export function removeLocalCli(appPath: string): void {
  const localCli = path.join(appPath, 'node_modules', '@nestjs', 'cli');
  if (fs.existsSync(localCli)) {
    fs.rmSync(localCli, { recursive: true, force: true });
  }
}

/**
 * Creates a symlink for the nest cli script path,
 * useful when testing different execution paths.
 * Note: on Windows this requires Developer Mode or elevated privileges.
 * @param linkPath the desired symlink path
 */
export function createCliSymlink(linkPath: string) {
  fs.symlinkSync(CLI_PATH, linkPath, 'file');
}

/**
 * Removes an existing link, if any.
 * @param linkPath the link
 */
export function removeLink(linkPath: string | undefined) {
  // May be undefined when beforeAll failed before the link was created.
  if (linkPath) {
    fs.rmSync(linkPath, { force: true });
  }
}
