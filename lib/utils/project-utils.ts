import * as inquirer from 'inquirer';

import { Configuration, ProjectConfiguration } from '../configuration';

import { Answers, Question } from 'inquirer';

import { generateSelect } from '../questions/questions';

export async function shouldAskForProject(
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

export async function askForProjectName(
  promptQuestion: string,
  projects: string[],
): Promise<Answers> {
  const questions: Question[] = [
    generateSelect('appName')(promptQuestion)(projects),
  ];
  const prompt = inquirer.createPromptModule();
  return await prompt(questions);
}

export function moveDefaultProjectToStart(
  configuration: Configuration,
  defaultProjectName: string,
  defaultLabel: string,
) {
  let projects: string[] = Object.keys(configuration.projects as {});
  if (configuration.sourceRoot !== 'src') {
    projects = projects.filter(
      p => p !== defaultProjectName.replace(defaultLabel, ''),
    );
  }
  projects.unshift(defaultProjectName);
  return projects;
}
