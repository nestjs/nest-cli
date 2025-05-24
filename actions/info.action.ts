import { blue, bold, green, red, yellow } from 'ansis';
import { readFileSync } from 'fs';
import { platform, release } from 'os';
import { join } from 'path';
import {
  AbstractPackageManager,
  PackageManagerFactory,
} from '../lib/package-managers';
import { BANNER, MESSAGES } from '../lib/ui';
import { AbstractAction } from './abstract.action';
import osName from '../lib/utils/os-info.utils';

interface LockfileDependency {
  version: string;
}

interface PackageJsonDependencies {
  [key: string]: LockfileDependency;
}

interface NestDependency {
  name: string;
  value: string;
  packageName: string;
}

interface NestDependencyWarnings {
  [key: string]: Array<NestDependency>;
}

export class InfoAction extends AbstractAction {
  private manager!: AbstractPackageManager;
  // Nest dependencies whitelist used to compare the major version
  private warningMessageDependenciesWhiteList = [
    '@nestjs/core',
    '@nestjs/common',
    '@nestjs/schematics',
    '@nestjs/platform-express',
    '@nestjs/platform-fastify',
    '@nestjs/platform-socket.io',
    '@nestjs/platform-ws',
    '@nestjs/websockets',
  ];

  public async handle() {
    this.manager = await PackageManagerFactory.find();
    this.displayBanner();
    await this.displaySystemInformation();
    await this.displayNestInformation();
  }

  private displayBanner() {
    console.info(red(BANNER));
  }

  private async displaySystemInformation(): Promise<void> {
    console.info(green`[System Information]`);
    console.info(
      'OS Version     :',
      blue(osName(platform(), release()) + release()),
    );
    console.info('NodeJS Version :', blue(process.version));
    await this.displayPackageManagerVersion();
  }

  async displayPackageManagerVersion() {
    try {
      const version: string = await this.manager.version();
      console.info(
        `${this.manager.name} Version    :`,
        blue(version),
        '\n',
      );
    } catch {
      console.error(
        `${this.manager.name} Version    :`,
        red`Unknown`,
        '\n',
      );
    }
  }

  async displayNestInformation(): Promise<void> {
    this.displayCliVersion();
    console.info(green`[Nest Platform Information]`);
    await this.displayNestInformationFromPackage();
  }

  async displayNestInformationFromPackage(): Promise<void> {
    try {
      const dependencies: PackageJsonDependencies =
        this.readProjectPackageDependencies();
      this.displayNestVersions(dependencies);
    } catch (err) {
      console.error(
        red(MESSAGES.NEST_INFORMATION_PACKAGE_MANAGER_FAILED),
      );
    }
  }

  displayCliVersion(): void {
    console.info(green`[Nest CLI]`);
    console.info(
      'Nest CLI Version :',
      blue(
        JSON.parse(readFileSync(join(__dirname, '../package.json')).toString())
          .version,
      ),
      '\n',
    );
  }

  readProjectPackageDependencies(): PackageJsonDependencies {
    const buffer = readFileSync(join(process.cwd(), 'package.json'));
    const pack = JSON.parse(buffer.toString());
    const dependencies = { ...pack.dependencies, ...pack.devDependencies };
    Object.keys(dependencies).forEach((key) => {
      dependencies[key] = {
        version: dependencies[key],
      };
    });
    return dependencies;
  }

  displayNestVersions(dependencies: PackageJsonDependencies) {
    const nestDependencies = this.buildNestVersionsMessage(dependencies);
    nestDependencies.forEach((dependency) =>
      console.info(dependency.name, blue(dependency.value)),
    );

    this.displayWarningMessage(nestDependencies);
  }

  displayWarningMessage(nestDependencies: NestDependency[]) {
    try {
      const warnings = this.buildNestVersionsWarningMessage(nestDependencies);
      const majorVersions = Object.keys(warnings);
      if (majorVersions.length > 0) {
        console.info('\r');
        console.info(yellow`[Warnings]`);
        console.info(
          'The following packages are not in the same major version',
        );
        console.info('This could lead to runtime errors');
        majorVersions.forEach((version) => {
          console.info(bold`* Under version ${version}`);
          warnings[version].forEach(({ packageName, value }) => {
            console.info(`- ${packageName} ${value}`);
          });
        });
      }
    } catch {
      console.info('\t');
      console.error(
        red(
          MESSAGES.NEST_INFORMATION_PACKAGE_WARNING_FAILED(
            this.warningMessageDependenciesWhiteList,
          ),
        ),
      );
    }
  }

  buildNestVersionsWarningMessage(
    nestDependencies: NestDependency[],
  ): NestDependencyWarnings {
    const unsortedWarnings = nestDependencies.reduce(
      (depWarningsGroup, { name, packageName, value }) => {
        if (!this.warningMessageDependenciesWhiteList.includes(packageName)) {
          return depWarningsGroup;
        }

        const [major] = value.replace(/[^\d.]/g, '').split('.', 1);
        const minimumVersion = major;
        depWarningsGroup[minimumVersion] = [
          ...(depWarningsGroup[minimumVersion] || []),
          { name, packageName, value },
        ];

        return depWarningsGroup;
      },
      Object.create(null) as NestDependencyWarnings,
    );

    const unsortedMinorVersions = Object.keys(unsortedWarnings);
    if (unsortedMinorVersions.length <= 1) {
      return {};
    }

    const sortedMinorVersions = unsortedMinorVersions.sort(
      (versionA, versionB) => {
        const numA = parseFloat(versionA);
        const numB = parseFloat(versionB);

        if (isNaN(numA) && isNaN(numB)) {
          // If both are not valid numbers, maintain the current order.
          return 0;
        }

        // NaN is considered greater than any number, so if numA is NaN, place it later.
        return isNaN(numA) ? 1 : isNaN(numB) ? -1 : numB - numA;
      },
    );

    return sortedMinorVersions.reduce(
      (warnings, minorVersion) => {
        warnings[minorVersion] = unsortedWarnings[minorVersion];
        return warnings;
      },
      Object.create(null) as NestDependencyWarnings,
    );
  }

  buildNestVersionsMessage(
    dependencies: PackageJsonDependencies,
  ): NestDependency[] {
    const nestDependencies = this.collectNestDependencies(dependencies);
    return this.format(nestDependencies);
  }

  collectNestDependencies(
    dependencies: PackageJsonDependencies,
  ): NestDependency[] {
    const nestDependencies: NestDependency[] = [];
    Object.keys(dependencies).forEach((key) => {
      if (key.indexOf('@nestjs') > -1) {
        const depPackagePath = require.resolve(key + '/package.json', {
          paths: [process.cwd()],
        });
        const depPackage = readFileSync(depPackagePath).toString();
        const value = JSON.parse(depPackage).version;
        nestDependencies.push({
          name: `${key.replace(/@nestjs\//, '').replace(/@.*/, '')} version`,
          value: value || dependencies[key].version,
          packageName: key,
        });
      }
    });

    return nestDependencies;
  }

  format(dependencies: NestDependency[]): NestDependency[] {
    const sorted = dependencies.sort(
      (dependencyA, dependencyB) =>
        dependencyB.name.length - dependencyA.name.length,
    );
    const length = sorted[0].name.length;
    sorted.forEach((dependency) => {
      if (dependency.name.length < length) {
        dependency.name = this.rightPad(dependency.name, length);
      }
      dependency.name = dependency.name.concat(' :');
      dependency.value = dependency.value.replace(/(\^|\~)/, '');
    });
    return sorted;
  }

  rightPad(name: string, length: number): string {
    while (name.length < length) {
      name = name.concat(' ');
    }
    return name;
  }
}
