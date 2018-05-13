import { Question } from 'inquirer';

export const generateInput = (name: string, defaultAnswer: string): (value: any) => Question | undefined => {
  return (value: string) => {
    if (value === undefined) {
      return {
        type: 'input',
        name: name,
        message: `${ name } :`,
        default: defaultAnswer
      };
    }
    return undefined;
  };
}

export const generateSelect = (name: string, message: string, choices: string[]): Question => {
  return {
    type: 'list',
    name: name,
    message: message,
    choices: choices
  };
}
