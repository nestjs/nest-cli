import chalk from 'chalk';
import { Answers } from 'inquirer';
import { Input } from '../commands';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';

import {
  AbstractCollection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics';
import { MESSAGES } from '../lib/ui';
import { AbstractAction } from './abstract.action';

import {
  askForProjectName,
  moveDefaultProjectToStart,
  shouldAskForProject,
} from '../lib/utils/project-utils';

import { loadConfiguration } from '../lib/utils/load-configuration';

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    await generateFiles(inputs.concat(options));
  }
}

const generateFiles = async (inputs: Input[]) => {
  const configuration = await loadConfiguration();
  const collectionOption = inputs.find(option => option.name === 'collection')!
    .value as string;
  const schematic = inputs.find(option => option.name === 'schematic')!
    .value as string;
  const appName = inputs.find(option => option.name === 'project')!
    .value as string;

  const collection: AbstractCollection = CollectionFactory.create(
    collectionOption || configuration.collection,
  );
  const schematicOptions: SchematicOption[] = mapSchematicOptions(inputs);
  schematicOptions.push(
    new SchematicOption('language', configuration.language),
  );
  const configurationProjects = configuration.projects;

  let sourceRoot = appName
    ? getValueOrDefault(configuration, 'sourceRoot', appName)
    : configuration.sourceRoot;

  // If you only add a `lib` we actually don't have monorepo: true BUT we do have "projects"
  // Ensure we don't run for new app/libs schematics
  if (await shouldAskForProject(schematic, configurationProjects, appName)) {
    const defaultLabel: string = ' [ Default ]';
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
  }

  schematicOptions.push(new SchematicOption('sourceRoot', sourceRoot));
  try {
    const schematicInput = inputs.find(input => input.name === 'schematic');
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
  const options: SchematicOption[] = [];
  inputs.forEach(input => {
    if (input.name !== 'schematic' && input.value !== undefined) {
      options.push(new SchematicOption(input.name, input.value));
    }
  });
  return options;
};
