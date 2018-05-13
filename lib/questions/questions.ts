import { Question } from 'inquirer';

export const generateInput = (name: string): (value: any) => (defaultAnwser: string) => Question | undefined => {
  return (value: string) => {
    if (value === undefined) {
      return (defaultAnswer: string) => {
        return {
          type: 'input',
          name: name,
          message: `${ name } :`,
          default: defaultAnswer
        };
      };
    }
    return undefined;
  };
}

export const generateSelect = (name: string): (message: string) => (choices: string[]) => Question => {
  return (message: string) => {
    return (choices: string[]) => {
      return {
        type: 'list',
        name: name,
        message: message,
        choices: choices
      };
    };
  };
}
