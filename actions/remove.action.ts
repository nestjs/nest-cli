import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import { AbstractAction } from '.';
import { Input } from '../commands';
import * as inquirer from 'inquirer';
import { Question } from 'inquirer';
import { generateSelect } from '../lib/questions/questions';
import { CLI_ERRORS, MESSAGES } from '../lib/ui';
import { getProjectDirectory } from '../lib/utils/project-utils';

export class RemoveAction extends AbstractAction {
  public async handle(inputs: Input[]) {
    const projectNameInput = inputs.find((input) => input.name === 'name')!;
    const projectDirectory = getProjectDirectory(projectNameInput);

    if (!fs.existsSync(path.join(process.cwd(), 'apps', projectDirectory))) {
      console.error(chalk.red(CLI_ERRORS.PROJECT_NOT_FOUND(projectDirectory)));
      process.exit(1);
    }

    const confirmed = await askForConfirmation();

    if (!confirmed) {
      console.log(chalk.yellow(CLI_ERRORS.ACTION_CANCELLED));
      process.exit(0);
    }

    if (check(projectDirectory)) {
      try {
        await removeProject(projectDirectory);
        updateNestCliJson(projectDirectory);

        console.log(
          chalk.green(
            `Successfully removed the ${chalk.bgGreenBright.red(
              projectDirectory,
            )} application and updated ${chalk.bgGreenBright.red(
              'nest-cli.json',
            )}`,
          ),
        );
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    }
    process.exit(0);
  }
}

const removeProject = async (projectDirectory: string) => {
  const projectPath = path.join(process.cwd(), 'apps', projectDirectory);

  try {
    fs.rmSync(projectPath, { recursive: true });
  } catch (error) {
    throw new Error(CLI_ERRORS.REMOVE_ACTION_FAILED);
  }
};

const updateNestCliJson = (removedAppName: string) => {
  const nestCliJsonPath = path.join(process.cwd(), 'nest-cli.json');

  try {
    const nestCliJsonContent = JSON.parse(
      fs.readFileSync(nestCliJsonPath, 'utf-8'),
    );

    // Create a new object without the specified key
    const { [removedAppName]: removedApp, ...updatedProjects } =
      nestCliJsonContent.projects;

    const updatedNestCliJson = {
      ...nestCliJsonContent,
      projects: updatedProjects,
    };

    fs.writeFileSync(
      nestCliJsonPath,
      JSON.stringify(updatedNestCliJson, null, 2),
    );
  } catch (error) {
    throw new Error(CLI_ERRORS.REMOVE_ACTION_NEST_CLI_JSON_UPDATE_FAILED);
  }
};

const check = (removedAppName: string) => {
  const nestCliJsonPath = path.join(process.cwd(), 'nest-cli.json');

  try {
    const nestCliJsonContent = JSON.parse(
      fs.readFileSync(nestCliJsonPath, 'utf-8'),
    );

    if (!nestCliJsonContent.monorepo) {
      console.error(chalk.red(CLI_ERRORS.REMOVE_ACTION_NOT_SUPPORTED));
      return false;
    }

    if (nestCliJsonContent.root === `apps/${removedAppName}`) {
      console.error(
        chalk.red(CLI_ERRORS.REMOVE_ACTION_FAILURE_FOR_ROOT_APPLICATION),
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(chalk.red(CLI_ERRORS.REMOVE_ACTION_NEST_CLI_JSON_NOT_FOUND));
    return false;
  }
};

const askForConfirmation = async (): Promise<boolean> => {
  const confirmationMessage = `${MESSAGES.PROJECT_REMOVE_CONFIRMATION} (yes/no):`;
  const questions: Question[] = [
    generateSelect('confirmation')(confirmationMessage)(['yes', 'no']),
  ];
  const prompt = inquirer.createPromptModule();
  const { confirmation } = await prompt(questions);

  return confirmation.toLowerCase() === 'yes';
};
