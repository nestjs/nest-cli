import * as chalk from 'chalk';
import { Answers } from 'inquirer';
import { CommandStorage } from '../commands';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import {
  AbstractCollection,
  Collection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics';
import { MESSAGES } from '../lib/ui';
import { loadConfiguration } from '../lib/utils/load-configuration';
import {
  askForProjectName,
  getSpecFileSuffix,
  moveDefaultProjectToStart,
  shouldAskForProject,
  shouldGenerateFlat,
  shouldGenerateSpec,
} from '../lib/utils/project-utils';
import { AbstractAction } from './abstract.action';

export class GenerateAction extends AbstractAction {
  public async handle(inputs: CommandStorage) {
    await generateFiles(inputs);
  }
}

const generateFiles = async (storage: CommandStorage) => {
  const configuration = await loadConfiguration();

  const collectionOption = storage.get<string>('collection', true).value;
  const schematic = storage.get<string>('schematic', true).value;
  const appName = storage.get<string>('project', true).value;
  const spec = storage.get<boolean>('spec', true);
  const flat = storage.get<boolean>('flat', true);
  const specFileSuffix = storage.get<string>('specFileSuffix', true);

  const collection: AbstractCollection = CollectionFactory.create(
    collectionOption || configuration.collection || Collection.NESTJS,
  );
  const schematicOptions: SchematicOption[] = mapSchematicOptions(storage);
  schematicOptions.push(
    new SchematicOption('language', configuration.language),
  );
  const configurationProjects = configuration.projects;

  let sourceRoot = appName
    ? getValueOrDefault(configuration, 'sourceRoot', appName)
    : configuration.sourceRoot;

  const specValue = spec.value;
  const flatValue = !!flat?.value;
  const specFileSuffixValue = specFileSuffix.value;
  const specOptions = spec.options;
  let generateSpec = shouldGenerateSpec(
    configuration,
    schematic,
    appName,
    specValue,
    specOptions.passedAsInput,
  );
  let generateFlat = shouldGenerateFlat(configuration, appName, flatValue);
  let generateSpecFileSuffix = getSpecFileSuffix(
    configuration,
    appName,
    specFileSuffixValue,
  );

  // If you only add a `lib` we actually don't have monorepo: true BUT we do have "projects"
  // Ensure we don't run for new app/libs schematics
  if (shouldAskForProject(schematic, configurationProjects, appName)) {
    const defaultLabel = ' [ Default ]';
    let defaultProjectName: string = configuration.sourceRoot + defaultLabel;

    for (const property in configurationProjects) {
      if (
        configurationProjects[property].sourceRoot === configuration.sourceRoot
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

    const answers: Answers = await askForProjectName(
      MESSAGES.PROJECT_SELECTION_QUESTION,
      projects,
    );

    const project: string = answers.appName.replace(defaultLabel, '');
    if (project !== configuration.sourceRoot) {
      sourceRoot = configurationProjects[project].sourceRoot;
    }

    if (answers.appName !== defaultProjectName) {
      // Only overwrite if the appName is not the default- as it has already been loaded above
      generateSpec = shouldGenerateSpec(
        configuration,
        schematic,
        answers.appName,
        specValue,
        specOptions.passedAsInput,
      );
      generateFlat = shouldGenerateFlat(
        configuration,
        answers.appNames,
        flatValue,
      );
      generateSpecFileSuffix = getSpecFileSuffix(
        configuration,
        appName,
        specFileSuffixValue,
      );
    }
  }

  schematicOptions.push(new SchematicOption('sourceRoot', sourceRoot));
  schematicOptions.push(new SchematicOption('spec', generateSpec));
  schematicOptions.push(new SchematicOption('flat', generateFlat));
  schematicOptions.push(
    new SchematicOption('specFileSuffix', generateSpecFileSuffix),
  );
  try {
    const schematicInput = storage.get<string>('schematic');
    if (!schematicInput) {
      throw new Error('Unable to find a schematic for this configuration');
    }
    await collection.execute(schematicInput.value, schematicOptions);
  } catch (error) {
    if (error && error.message) {
      console.error(chalk.red(error.message));
    }
  }
};

const mapSchematicOptions = (storage: CommandStorage): SchematicOption[] => {
  const excludedInputNames = ['schematic', 'spec', 'flat', 'specFileSuffix'];
  const options: SchematicOption[] = [];
  storage.forEachEntry((commandStorageEntry) => {
    if (
      !excludedInputNames.includes(commandStorageEntry.name) &&
      commandStorageEntry.value !== undefined
    ) {
      options.push(
        new SchematicOption(
          commandStorageEntry.name,
          commandStorageEntry.value,
        ),
      );
    }
  });
  return options;
};
