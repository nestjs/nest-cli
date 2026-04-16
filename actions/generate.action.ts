import { red } from 'ansis';
import * as path from 'path';
import { GenerateCommandContext } from '../commands/index.js';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default.js';
import {
  AbstractCollection,
  Collection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics/index.js';
import { MESSAGES } from '../lib/ui/index.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import {
  askForProjectName,
  getSpecFileSuffix,
  moveDefaultProjectToStart,
  shouldAskForProject,
  shouldGenerateFlat,
  shouldGenerateSpec,
} from '../lib/utils/project-utils.js';
import { AbstractAction } from './abstract.action.js';

export class GenerateAction extends AbstractAction {
  public async handle(context: GenerateCommandContext) {
    await generateFiles(context);
  }
}

const generateFiles = async (context: GenerateCommandContext) => {
  const configuration = await loadConfiguration();
  const collectionOption = context.collection;
  const schematic = context.schematic;
  const appName = context.project ?? '';
  const specFileSuffix = context.specFileSuffix;

  const collection: AbstractCollection = CollectionFactory.create(
    collectionOption || configuration.collection || Collection.NESTJS,
  );

  const schematicOptions: SchematicOption[] =
    mapContextToSchematicOptions(context);
  schematicOptions.push(
    new SchematicOption('language', configuration.language),
  );
  const configurationProjects = configuration.projects;

  let sourceRoot = appName
    ? getValueOrDefault(configuration, 'sourceRoot', appName)
    : configuration.sourceRoot;

  const specValue =
    typeof context.spec === 'boolean' ? context.spec : context.spec.value;
  const specPassedAsInput =
    typeof context.spec === 'boolean' ? false : context.spec.passedAsInput;
  const flatValue = context.flat !== undefined ? !!context.flat : false;
  const specFileSuffixValue = specFileSuffix as string;
  let generateSpec = shouldGenerateSpec(
    configuration,
    schematic,
    appName,
    specValue,
    specPassedAsInput,
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

    const selectedProjectName = (await askForProjectName(
      MESSAGES.PROJECT_SELECTION_QUESTION,
      projects,
    )) as string;

    const project: string = selectedProjectName.replace(defaultLabel, '');
    if (project !== configuration.sourceRoot) {
      sourceRoot = configurationProjects[project].sourceRoot;
    }

    if (selectedProjectName !== defaultProjectName) {
      // Only overwrite if the appName is not the default- as it has already been loaded above
      generateSpec = shouldGenerateSpec(
        configuration,
        schematic,
        selectedProjectName,
        specValue,
        specPassedAsInput,
      );
      generateFlat = shouldGenerateFlat(
        configuration,
        selectedProjectName,
        flatValue,
      );
      generateSpecFileSuffix = getSpecFileSuffix(
        configuration,
        selectedProjectName,
        specFileSuffixValue,
      );
    }
  }

  if (configuration.generateOptions?.baseDir) {
    sourceRoot = path.join(sourceRoot, configuration.generateOptions.baseDir);
  }

  schematicOptions.push(new SchematicOption('sourceRoot', sourceRoot));
  schematicOptions.push(new SchematicOption('spec', generateSpec));
  schematicOptions.push(new SchematicOption('flat', generateFlat));
  schematicOptions.push(
    new SchematicOption('specFileSuffix', generateSpecFileSuffix),
  );
  schematicOptions.push(new SchematicOption('format', context.format));
  try {
    if (!schematic) {
      throw new Error('Unable to find a schematic for this configuration');
    }
    await collection.execute(schematic, schematicOptions);
  } catch (error) {
    if (error && error.message) {
      console.error(red(error.message));
    }
  }
};

const mapContextToSchematicOptions = (
  context: GenerateCommandContext,
): SchematicOption[] => {
  const options: SchematicOption[] = [];
  // Only include fields that schematics expect; exclude those handled separately
  if (context.name !== undefined)
    options.push(new SchematicOption('name', context.name));
  if (context.path !== undefined)
    options.push(new SchematicOption('path', context.path));
  if (context.dryRun)
    options.push(new SchematicOption('dry-run', true));
  if (context.collection !== undefined)
    options.push(new SchematicOption('collection', context.collection));
  if (context.project !== undefined)
    options.push(new SchematicOption('project', context.project));
  if (context.skipImport !== undefined)
    options.push(new SchematicOption('skipImport', context.skipImport));
  // 'schematic', 'spec', 'flat', 'specFileSuffix' are handled separately
  return options;
};
