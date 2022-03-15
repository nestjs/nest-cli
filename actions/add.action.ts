import * as chalk from 'chalk';
import { Input } from '../commands';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import {
  AbstractPackageManager,
  PackageManagerFactory
} from '../lib/package-managers';
import {
  AbstractCollection,
  CollectionFactory,
  SchematicOption
} from '../lib/schematics';
import { MESSAGES } from '../lib/ui';
import { loadConfiguration } from '../lib/utils/load-configuration';
import {
  askForProjectName,
  moveDefaultProjectToStart,
  shouldAskForProject
} from '../lib/utils/project-utils';
import { AbstractAction } from './abstract.action';

const schematicName = 'nest-add';

export class AddAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[], extraFlags: string[]) {
    const libraryName = this.getLibraryName(inputs);
    const packageName = this.getPackageName(libraryName);
    const collectionName = this.getCollectionName(libraryName, packageName);
    const tagName = this.getTagName(packageName);
    const packageInstallSuccess = await this.installPackage(
      collectionName,
      tagName,
    );
    if (packageInstallSuccess) {
      const sourceRootOption: Input = await this.getSourceRoot(
        inputs.concat(options),
      );
      options.push(sourceRootOption);

      await this.addLibrary(collectionName, options, extraFlags);
    } else {
      console.error(
        chalk.red(
          MESSAGES.LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE(libraryName),
        ),
      );
      throw new Error(MESSAGES.LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE(libraryName));
    }
  }

  private async getSourceRoot(inputs: Input[]): Promise<Input> {
    const configuration = await loadConfiguration();
    const configurationProjects = configuration.projects;

    const appName = inputs.find((option) => option.name === 'project')!
      .value as string;

    let sourceRoot = appName
      ? getValueOrDefault(configuration, 'sourceRoot', appName)
      : configuration.sourceRoot;

    const shouldAsk = shouldAskForProject(
      schematicName,
      configurationProjects,
      appName,
    );
    if (shouldAsk) {
      const defaultLabel = ' [ Default ]';
      let defaultProjectName = configuration.sourceRoot + defaultLabel;

      for (const property in configurationProjects) {
        if (
          configurationProjects[property].sourceRoot ===
          configuration.sourceRoot
        ) {
          defaultProjectName = property + defaultLabel;
          break;
        }
      }

      const projects = moveDefaultProjectToStart(
        configuration,
        defaultProjectName,
        defaultLabel,
      );

      const answers = await askForProjectName(
        MESSAGES.LIBRARY_PROJECT_SELECTION_QUESTION,
        projects,
      );
      const project = answers.appName.replace(defaultLabel, '');
      if (project !== configuration.sourceRoot) {
        sourceRoot = configurationProjects[project].sourceRoot;
      }
    }
    return { name: 'sourceRoot', value: sourceRoot };
  }

  private async installPackage(
    collectionName: string,
    tagName: string,
  ): Promise<boolean> {
    const manager: AbstractPackageManager = await PackageManagerFactory.find();
    tagName = tagName || 'latest';
    let installResult = false;
    try {
      installResult = await manager.addProduction([collectionName], tagName);
    } catch (error) {
      if (error && error.message) {
        console.error(chalk.red(error.message));
      }
    }
    return installResult;
  }

  private async addLibrary(
    collectionName: string,
    options: Input[],
    extraFlags: string[],
  ) {
    console.info(MESSAGES.LIBRARY_INSTALLATION_STARTS);
    const schematicOptions: SchematicOption[] = [];
    schematicOptions.push(
      new SchematicOption(
        'sourceRoot',
        options.find((option) => option.name === 'sourceRoot')!.value as string,
      ),
    );
    const extraFlagsString = extraFlags ? extraFlags.join(' ') : undefined;

    try {
      const collection: AbstractCollection =
        CollectionFactory.create(collectionName);
      await collection.execute(
        schematicName,
        schematicOptions,
        extraFlagsString,
      );
    } catch (error) {
      if (error && error.message) {
        console.error(chalk.red(error.message));
        return Promise.reject();
      }
    }
  }

  private getLibraryName(inputs: Input[]): string {
    const libraryInput: Input = inputs.find(
      (input) => input.name === 'library',
    ) as Input;

    if (!libraryInput) {
      throw new Error('No library found in command input');
    }
    return libraryInput.value as string;
  }

  private getPackageName(library: string): string {
    return library.startsWith('@')
      ? library.split('/', 2).join('/')
      : library.split('/', 1)[0];
  }

  private getCollectionName(library: string, packageName: string): string {
    return (
      (packageName.startsWith('@')
        ? packageName.split('@', 2).join('@')
        : packageName.split('@', 1).join('@')) +
      library.slice(packageName.length)
    );
  }

  private getTagName(packageName: string): string {
    return packageName.startsWith('@')
      ? packageName.split('@', 3)[2]
      : packageName.split('@', 2)[1];
  }
}
