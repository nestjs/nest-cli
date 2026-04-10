import { blue, bold, green, red, yellow } from 'ansis';
import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getBuilder } from '../lib/compiler/helpers/get-builder.js';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default.js';
import { Configuration } from '../lib/configuration/index.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import { AbstractAction } from './abstract.action.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export class DoctorAction extends AbstractAction {
  public async handle() {
    console.info();
    console.info(bold('Nest Doctor'));
    console.info();

    const results: CheckResult[] = [];

    results.push(this.checkNodeVersion());
    results.push(this.checkTypeScriptVersion());
    results.push(this.checkCliVersion());

    let configuration: Required<Configuration> | undefined;
    try {
      configuration = await loadConfiguration();
      results.push({ status: 'pass', message: 'nest-cli.json is valid' });
    } catch {
      results.push({
        status: 'fail',
        message: 'nest-cli.json is missing or invalid',
      });
    }

    if (configuration) {
      results.push(...this.checkBuilder(configuration));
      results.push(...this.checkSourceRoot(configuration));
      results.push(...this.checkEntryFile(configuration));
      results.push(...this.checkPlugins(configuration));
      results.push(...this.checkNestVersionAlignment());
    }

    this.printResults(results);
  }

  private checkNodeVersion(): CheckResult {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0], 10);
    if (major >= 20) {
      return { status: 'pass', message: `Node.js version (${version})` };
    }
    return {
      status: 'fail',
      message: `Node.js version (${version}) — minimum required is v20.11`,
    };
  }

  private checkTypeScriptVersion(): CheckResult {
    try {
      const tsPath = require.resolve('typescript/package.json', {
        paths: [process.cwd()],
      });
      const tsVersion = JSON.parse(readFileSync(tsPath, 'utf8')).version;
      return {
        status: 'pass',
        message: `TypeScript version (${tsVersion})`,
      };
    } catch {
      return {
        status: 'fail',
        message: 'TypeScript is not installed',
      };
    }
  }

  private checkCliVersion(): CheckResult {
    try {
      const cliVersion = JSON.parse(
        readFileSync(join(__dirname, '../package.json'), 'utf8'),
      ).version;
      return {
        status: 'pass',
        message: `@nestjs/cli version (${cliVersion})`,
      };
    } catch {
      return {
        status: 'warn',
        message: 'Could not determine @nestjs/cli version',
      };
    }
  }

  private checkBuilder(configuration: Required<Configuration>): CheckResult[] {
    const results: CheckResult[] = [];
    const builder = getBuilder(configuration, {}, undefined);

    switch (builder.type) {
      case 'swc': {
        const deps = ['@swc/core', '@swc/cli'];
        for (const dep of deps) {
          try {
            require.resolve(dep, { paths: [process.cwd()] });
            results.push({
              status: 'pass',
              message: `Builder dependency ${dep} is installed`,
            });
          } catch {
            results.push({
              status: 'fail',
              message: `Builder "swc" configured but ${dep} is not installed`,
            });
          }
        }
        break;
      }
      case 'webpack': {
        const deps = [
          'webpack',
          'webpack-node-externals',
          'ts-loader',
        ];
        for (const dep of deps) {
          try {
            require.resolve(dep, { paths: [process.cwd()] });
          } catch {
            results.push({
              status: 'fail',
              message: `Builder "webpack" configured but ${dep} is not installed`,
            });
          }
        }
        if (results.length === 0) {
          results.push({
            status: 'pass',
            message: 'Builder "webpack" dependencies are installed',
          });
        }
        break;
      }
      case 'rspack': {
        try {
          require.resolve('@rspack/core', { paths: [process.cwd()] });
          results.push({
            status: 'pass',
            message: 'Builder "rspack" dependencies are installed',
          });
        } catch {
          results.push({
            status: 'fail',
            message:
              'Builder "rspack" configured but @rspack/core is not installed',
          });
        }
        break;
      }
      default:
        results.push({
          status: 'pass',
          message: `Builder "${builder.type}" configured`,
        });
    }
    return results;
  }

  private checkSourceRoot(
    configuration: Required<Configuration>,
  ): CheckResult[] {
    const sourceRoot = configuration.sourceRoot;
    const fullPath = join(process.cwd(), sourceRoot);
    if (existsSync(fullPath)) {
      return [
        { status: 'pass', message: `Source root (${sourceRoot}/) exists` },
      ];
    }
    return [
      {
        status: 'fail',
        message: `Source root (${sourceRoot}/) does not exist`,
      },
    ];
  }

  private checkEntryFile(
    configuration: Required<Configuration>,
  ): CheckResult[] {
    const entryFile = configuration.entryFile;
    const sourceRoot = configuration.sourceRoot;
    const tsPath = join(process.cwd(), sourceRoot, `${entryFile}.ts`);
    if (existsSync(tsPath)) {
      return [
        {
          status: 'pass',
          message: `Entry file (${sourceRoot}/${entryFile}.ts) exists`,
        },
      ];
    }
    return [
      {
        status: 'fail',
        message: `Entry file (${sourceRoot}/${entryFile}.ts) not found`,
      },
    ];
  }

  private checkPlugins(
    configuration: Required<Configuration>,
  ): CheckResult[] {
    const results: CheckResult[] = [];
    const plugins =
      getValueOrDefault<any[]>(
        configuration,
        'compilerOptions.plugins',
        undefined,
      ) || [];

    for (const plugin of plugins) {
      const pluginName = typeof plugin === 'string' ? plugin : plugin.name;
      try {
        require.resolve(pluginName, { paths: [process.cwd()] });
        results.push({
          status: 'pass',
          message: `Plugin "${pluginName}" is installed`,
        });
      } catch {
        results.push({
          status: 'fail',
          message: `Plugin "${pluginName}" is referenced but not installed`,
        });
      }
    }
    return results;
  }

  private checkNestVersionAlignment(): CheckResult[] {
    const results: CheckResult[] = [];
    const packages = [
      '@nestjs/core',
      '@nestjs/common',
      '@nestjs/platform-express',
      '@nestjs/platform-fastify',
    ];

    const versions: { name: string; major: number }[] = [];

    for (const pkg of packages) {
      try {
        const pkgPath = require.resolve(`${pkg}/package.json`, {
          paths: [process.cwd()],
        });
        const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
        const major = parseInt(version.split('.')[0], 10);
        versions.push({ name: pkg, major });
      } catch {
        // Package not installed, skip
      }
    }

    if (versions.length >= 2) {
      const majors = new Set(versions.map((v) => v.major));
      if (majors.size > 1) {
        const detail = versions
          .map((v) => `${v.name}@${v.major}`)
          .join(', ');
        results.push({
          status: 'warn',
          message: `NestJS package version mismatch: ${detail}`,
        });
      } else {
        results.push({
          status: 'pass',
          message: 'NestJS packages are version-aligned',
        });
      }
    }
    return results;
  }

  private printResults(results: CheckResult[]) {
    let warnings = 0;
    let errors = 0;

    for (const result of results) {
      switch (result.status) {
        case 'pass':
          console.info(green(`  ✓ ${result.message}`));
          break;
        case 'warn':
          console.info(yellow(`  ⚠ ${result.message}`));
          warnings++;
          break;
        case 'fail':
          console.info(red(`  ✗ ${result.message}`));
          errors++;
          break;
      }
    }

    console.info();
    if (errors === 0 && warnings === 0) {
      console.info(green(bold('No issues found.')));
    } else {
      const parts = [];
      if (warnings > 0) parts.push(yellow(`${warnings} warning(s)`));
      if (errors > 0) parts.push(red(`${errors} error(s)`));
      console.info(`Found ${parts.join(' and ')}.`);
    }
    console.info();
  }
}
