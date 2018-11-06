export const generateInput = (
  name: string,
): ((value: any) => (defaultAnwser: string) => any) => {
  return (value: string) => {
    if (value === undefined) {
      return (defaultAnswer: string): any => ({
        type: 'input',
        name,
        message: `${name} :`,
        default: defaultAnswer,
      });
    }

    return (defaultAnswer: string) => undefined;
  };
};

export const generateSelect = (
  name: string,
): ((message: string) => (choices: string[]) => any) => {
  return (message: string) => {
    return (choices: string[]) => ({
      type: 'list',
      name,
      message,
      choices,
    });
  };
};
