import * as inquirer from 'inquirer';
import { Answers, Question } from 'inquirer';
import { Input } from '../../commands';
import { getValueOrDefault } from '../compiler/helpers/get-value-or-default';
import { Configuration, ProjectConfiguration } from '../configuration';
import { generateSelect } from '../questions/questions';
import { normalizeToKebabOrSnakeCase } from './formatting';

export function shouldAskForProject(
  schematic: string,
  configurationProjects: { [key: string]: ProjectConfiguration },
  appName: string,
) {
  return (
    ['app', 'sub-app', 'library', 'lib'].includes(schematic) === false &&
    configurationProjects &&
    Object.entries(configurationProjects).length !== 0 &&
    !appName
  );
}

export function shouldGenerateSpec(
  configuration: Required<Configuration>,
  schematic: string,
  appName: string,
  specValue: boolean,
  specPassedAsInput?: boolean,
) {
  if (specPassedAsInput === true || specPassedAsInput === undefined) {
    // CLI parameters has the highest priority
    return specValue;
  }

  let specConfiguration = getValueOrDefault(
    configuration,
    'generateOptions.spec',
    appName || '',
  );
  if (typeof specConfiguration === 'boolean') {
    return specConfiguration;
  }

  if (
    typeof specConfiguration === 'object' &&
    specConfiguration[schematic] !== undefined
  ) {
    return specConfiguration[schematic];
  }

  if (typeof specConfiguration === 'object' && appName) {
    // The appName has a generateOption spec, but not for the schematic trying to generate
    // Check if the global generateOptions has a spec to use instead
    specConfiguration = getValueOrDefault(
      configuration,
      'generateOptions.spec',
      '',
    );
    if (typeof specConfiguration === 'boolean') {
      return specConfiguration;
    }

    if (
      typeof specConfiguration === 'object' &&
      specConfiguration[schematic] !== undefined
    ) {
      return specConfiguration[schematic];
    }
  }
  return specValue;
}

export function shouldGenerateFlat(
  configuration: Required<Configuration>,
  appName: string,
  flatValue: boolean,
): boolean {
  // CLI parameters have the highest priority
  if (flatValue === true) {
    return flatValue;
  }

  const flatConfiguration = getValueOrDefault(
    configuration,
    'generateOptions.flat',
    appName || '',
  );
  if (typeof flatConfiguration === 'boolean') {
    return flatConfiguration;
  }
  return flatValue;
}

export function getSpecFileSuffix(
  configuration: Required<Configuration>,
  appName: string,
  specFileSuffixValue: string,
): string {
  // CLI parameters have the highest priority
  if (specFileSuffixValue) {
    return specFileSuffixValue;
  }

  const specFileSuffixConfiguration = getValueOrDefault(
    configuration,
    'generateOptions.specFileSuffix',
    appName || '',
    undefined,
    undefined,
    'spec',
  );
  if (typeof specFileSuffixConfiguration === 'string') {
    return specFileSuffixConfiguration;
  }
  return specFileSuffixValue;
}

export async function askForProjectName(
  promptQuestion: string,
  projects: string[],
): Promise<Answers> {
  const questions: Question[] = [
    generateSelect('appName')(promptQuestion)(projects),
  ];
  const prompt = inquirer.createPromptModule();
  return prompt(questions);
}

export function moveDefaultProjectToStart(
  configuration: Configuration,
  defaultProjectName: string,
  defaultLabel: string,
) {
  let projects: string[] =
    configuration.projects != null ? Object.keys(configuration.projects) : [];
  if (configuration.sourceRoot !== 'src') {
    projects = projects.filter(
      (p) => p !== defaultProjectName.replace(defaultLabel, ''),
    );
  }
  projects.unshift(defaultProjectName);
  return projects;
}

export function hasValidOptionFlag(
  queriedOptionName: string,
  options: Input[],
  queriedValue: string | number | boolean = true,
): boolean {
  return options.some(
    (option: Input) =>
      option.name === queriedOptionName && option.value === queriedValue,
  );
}

export const getProjectDirectory = (
  applicationName: Input,
  directoryOption?: Input,
): string => {
  return (
    (directoryOption && (directoryOption.value as string)) ||
    normalizeToKebabOrSnakeCase(applicationName.value as string)
  );
};
