export const generateInput = (name: string, message: string) => {
  return (defaultAnswer: string) => ({
    name,
    message,
    default: defaultAnswer,
  });
};

export const generateSelect = (name: string) => {
  return (message: string) => {
    return (choices: string[]) => {
      const choicesFormatted = choices.map((choice) => ({
        name: choice,
        value: choice,
      }));
      return {
        name,
        message,
        choices: choicesFormatted,
      };
    };
  };
};
