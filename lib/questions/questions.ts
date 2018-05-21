import { Question } from 'inquirer';

export const generateInput = (name: string): (value: any) => (defaultAnwser: string) => Question | undefined => {
  return (value: string) => {
    if (value === undefined) {
      return (defaultAnswer: string): Question => ({
        type: 'input',
        name,
        message: `${ name } :`,
        default: defaultAnswer,
      });
    }

    return (defaultAnswer: string) => undefined;
  };
};

export const generateSelect = (name: string): (message: string) => (choices: string[]) => Question => {
  return (message: string) => {
    return (choices: string[]) => ({
        type: 'list',
        name,
        message,
        choices,
    });
  };
};
