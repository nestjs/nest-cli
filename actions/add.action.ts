import { red } from 'ansis';
import { AddCommandContext } from '../commands/index.js';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default.js';
import {
  AbstractPackageManager,
  PackageManagerFactory,
} from '../lib/package-managers/index.js';
import {
  AbstractCollection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics/index.js';
import { MESSAGES } from '../lib/ui/index.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import {
  askForProjectName,
  moveDefaultProjectToStart,
  shouldAskForProject,
} from '../lib/utils/project-utils.js';
import { AbstractAction } from './abstract.action.js';

const schematicName = 'nest-add';

export class AddAction extends AbstractAction {
  public async handle(context: AddCommandContext) {
    const libraryName = context.library;
    const packageName = this.getPackageName(libraryName);
    const collectionName = this.getCollectionName(libraryName, packageName);
    const tagName = this.getTagName(packageName);
    const packageInstallSuccess =
      context.skipInstall ||
      (await this.installPackage(collectionName, tagName));
    if (packageInstallSuccess) {
      const sourceRoot = await this.getSourceRoot(context.project);
      await this.addLibrary(collectionName, sourceRoot, context.extraFlags);
    } else {
      console.error(
        red(MESSAGES.LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE(libraryName)),
      );
      throw new Error(
        MESSAGES.LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE(libraryName),
      );
    }
  }

  private async getSourceRoot(project?: string): Promise<string> {
    const configuration = await loadConfiguration();
    const configurationProjects = configuration.projects;

    let sourceRoot = project
      ? getValueOrDefault(configuration, 'sourceRoot', project)
      : configuration.sourceRoot;

    const shouldAsk = shouldAskForProject(
      schematicName,
      configurationProjects,
      project ?? '',
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

      const selectedProject = (await askForProjectName(
        MESSAGES.LIBRARY_PROJECT_SELECTION_QUESTION,
        projects,
      )) as string;
      const projectName = selectedProject.replace(defaultLabel, '');
      if (projectName !== configuration.sourceRoot) {
        sourceRoot = configurationProjects[projectName].sourceRoot;
      }
    }
    return sourceRoot;
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
      if (error instanceof Error) {
        console.error(red(error.message));
      }
    }
    return installResult;
  }

  private async addLibrary(
    collectionName: string,
    sourceRoot: string,
    extraFlags: string[],
  ) {
    console.info(MESSAGES.LIBRARY_INSTALLATION_STARTS);
    const schematicOptions: SchematicOption[] = [];
    schematicOptions.push(new SchematicOption('sourceRoot', sourceRoot));
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
      if (error instanceof Error) {
        console.error(red(error.message));
      }
      throw error;
    }
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
    // For scoped packages like "@scope/pkg@1.0.0", split('@', 3) yields
    // ["", "scope/pkg", "1.0.0"]. For "@scope/pkg" with no version,
    // the tag slot is undefined. Fall back to an empty string so the
    // return type stays string and installPackage can substitute "latest".
    const tag = packageName.startsWith('@')
      ? packageName.split('@', 3)[2]
      : packageName.split('@', 2)[1];
    return tag ?? '';
  }
}
