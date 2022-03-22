import * as chalk from 'chalk';
import { Answers } from 'inquirer';
import { Input } from '../commands';
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
  moveDefaultProjectToStart,
  shouldAskForProject,
  shouldGenerateSpec,
} from '../lib/utils/project-utils';
import { AbstractAction } from './abstract.action';

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    await generateFiles(inputs.concat(options));
  }
}

const generateFiles = async (inputs: Input[]) => {
  const configuration = await loadConfiguration();
  const collectionOption = inputs.find(
    (option) => option.name === 'collection',
  )!.value as string;
  const schematic = inputs.find((option) => option.name === 'schematic')!
    .value as string;
  const appName = inputs.find((option) => option.name === 'project')!
    .value as string;
  const spec = inputs.find((option) => option.name === 'spec');

  const collection: AbstractCollection = CollectionFactory.create(
    collectionOption || configuration.collection || Collection.NESTJS,
  );
  const schematicOptions: SchematicOption[] = mapSchematicOptions(inputs);
  schematicOptions.push(
    new SchematicOption('language', configuration.language),
  );
  const configurationProjects = configuration.projects;

  let sourceRoot = appName
    ? getValueOrDefault(configuration, 'sourceRoot', appName)
    : configuration.sourceRoot;

  const specValue = spec!.value as boolean;
  const specOptions = spec!.options as any;
  let generateSpec = shouldGenerateSpec(
    configuration,
    schematic,
    appName,
    specValue,
    specOptions.passedAsInput,
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
    }
  }

  schematicOptions.push(new SchematicOption('sourceRoot', sourceRoot));
  schematicOptions.push(new SchematicOption('spec', generateSpec));
  try {
    const schematicInput = inputs.find((input) => input.name === 'schematic');
    if (!schematicInput) {
      throw new Error('Unable to find a schematic for this configuration');
    }
    await collection.execute(schematicInput.value as string, schematicOptions);
  } catch (error) {
    if (error && error.message) {
      console.error(chalk.red(error.message));
    }
  }
};

const mapSchematicOptions = (inputs: Input[]): SchematicOption[] => {
  const excludedInputNames = ['schematic', 'spec'];
  const options: SchematicOption[] = [];
  inputs.forEach((input) => {
    if (!excludedInputNames.includes(input.name) && input.value !== undefined) {
      const keepInputName = input.options
        ? 'keepInputNameFormat' in input.options
        : false;
      options.push(new SchematicOption(input.name, input.value, keepInputName));
    }
  });
  return options;
};
