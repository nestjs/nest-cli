import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Answers, Question } from 'inquirer';
import { Input } from '../commands';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import {
  Configuration,
  ConfigurationLoader,
  ProjectConfiguration,
} from '../lib/configuration';
import { NestConfigurationLoader } from '../lib/configuration/nest-configuration.loader';
import { generateSelect } from '../lib/questions/questions';
import { FileSystemReader } from '../lib/readers';
import {
  AbstractCollection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics';
import { MESSAGES } from '../lib/ui';
import { AbstractAction } from './abstract.action';

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
  if (shouldAskForProject(schematic, configurationProjects, appName)) {
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

    const answers: Answers = await askForProjectName(projects);
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

const moveDefaultProjectToStart = (
  configuration: Configuration,
  defaultProjectName: string,
  defaultLabel: string,
) => {
  let projects: string[] = Object.keys(configuration.projects as {});
  if (configuration.sourceRoot !== 'src') {
    projects = projects.filter(
      p => p !== defaultProjectName.replace(defaultLabel, ''),
    );
  }
  projects.unshift(defaultProjectName);
  return projects;
};

const askForProjectName = async (projects: string[]): Promise<Answers> => {
  const questions: Question[] = [
    generateSelect('appName')(MESSAGES.PROJECT_SELECTION_QUESTION)(projects),
  ];
  const prompt = inquirer.createPromptModule();
  return await prompt(questions);
};

const loadConfiguration = async (): Promise<Required<Configuration>> => {
  const loader: ConfigurationLoader = new NestConfigurationLoader(
    new FileSystemReader(process.cwd()),
  );
  return loader.load();
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

const shouldAskForProject = (
  schematic: string,
  configurationProjects: { [key: string]: ProjectConfiguration },
  appName: string,
) => {
  return (
    ['app', 'sub-app', 'library', 'lib'].includes(schematic) === false &&
    configurationProjects &&
    Object.entries(configurationProjects).length !== 0 &&
    !appName
  );
};
