import { ChildProcess, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  return stripAnsi(
    execSync(command, {
      cwd: cwd ?? process.cwd(),
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      timeout: 120_000,
    }),
  );
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
): { child: ChildProcess; output: () => string; kill: () => void } {
  const child = spawn('node', [CLI_PATH, ...args.split(/\s+/)], {
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
 * Make an HTTP GET request and return the response body.
 */
export function httpGet(
  url: string,
  timeoutMs = 5000,
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
  execSync('npm install', {
    cwd: appPath,
    encoding: 'utf-8',
    timeout: 120_000,
    stdio: 'pipe',
  });
  return appPath;
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
