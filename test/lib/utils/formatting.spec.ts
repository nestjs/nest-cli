import { normalizeToCase, CaseType } from '../../../lib/utils/formatting';

type TestSuite = {
  description: string;
  input: string;
  caseType: CaseType;
  expected: string;
};

describe('Testing string formatting function', () => {

  describe('should format to camelCase', () => {

    const tests: TestSuite[] = [
      {
        description: 'From kebab to camel',
        input: 'my-app',
        caseType: 'camel',
        expected: 'myApp',
      },
      {
        description: 'From kebab to camel with special character',
        input: '$my-app',
        caseType: 'camel',
        expected: 'myApp',
      },
      {
        description: 'From Pascal to camel',
        input: 'PascalCase',
        caseType: 'camel',
        expected: 'pascalCase',
      },
      {
        description: 'From Pascal to camel with special character',
        input: '$PascalCase',
        caseType: 'camel',
        expected: 'pascalCase',
      },
      {
        description: 'camel special character',
        input: '$catDog',
        caseType: 'camel',
        expected: 'catDog',
      },
      {
        description: 'camel special character',
        input: 'Cats? & Dogs!',
        caseType: 'camel',
        expected: 'catsDogs',
      },
    ];

    tests.forEach((test) => {
      it(test.description, () => {
        expect(normalizeToCase(test.input, test.caseType)).toEqual(test.expected);
      });
    });

  });

  describe('should format to kebab-case', () => {

    const tests: TestSuite[] = [
      {
        description: 'From camel to kebab',
        input: 'myApp',
        caseType: 'kebab',
        expected: 'my-app',
      },
      {
        description: 'From camel to kebab with special character',
        input: '$myApp',
        caseType: 'kebab',
        expected: 'my-app',
      },
      {
        description: 'From Pascal to kebab',
        input: 'PascalCase',
        caseType: 'kebab',
        expected: 'pascal-case',
      },
      {
        description: 'From Pascal to kebab with special character',
        input: '$PascalCase',
        caseType: 'kebab',
        expected: 'pascal-case',
      },
      {
        description: 'kebab special character',
        input: '$cat-dog',
        caseType: 'kebab',
        expected: 'cat-dog',
      },
      {
        description: 'kebab special character',
        input: 'Cats? & Dogs!',
        caseType: 'kebab',
        expected: 'cats-dogs',
      },
    ];

    tests.forEach((test) => {
      it(test.description, () => {
        expect(normalizeToCase(test.input, test.caseType)).toEqual(test.expected);
      });
    });
  });

  describe('should format to snake_case', () => {

    const tests: TestSuite[] = [
      {
        description: 'From camel to snake',
        input: 'myApp',
        caseType: 'snake',
        expected: 'my_app',
      },
      {
        description: 'From camel to snake with special character',
        input: '$myApp',
        caseType: 'snake',
        expected: 'my_app',
      },
      {
        description: 'From Pascal to snake',
        input: 'PascalCase',
        caseType: 'snake',
        expected: 'pascal_case',
      },
      {
        description: 'From Pascal to snake with special character',
        input: '$PascalCase',
        caseType: 'snake',
        expected: 'pascal_case',
      },
      {
        description: 'snake special character',
        input: '$cat-dog',
        caseType: 'snake',
        expected: 'cat_dog',
      },
      {
        description: 'kebab special character',
        input: 'Cats? & Dogs!',
        caseType: 'snake',
        expected: 'cats_dogs',
      },
    ];

    tests.forEach((test) => {
      it(test.description, () => {
        expect(normalizeToCase(test.input, test.caseType)).toEqual(test.expected);
      });
    });
  });


  describe('should format to PascalCase', () => {
    const tests: TestSuite[] = [
      {
        description: 'From camel to PascalCase',
        input: 'myApp',
        caseType: 'pascal',
        expected: 'MyApp',
      },
      {
        description: 'From camel to PascalCase with special character',
        input: '$myApp',
        caseType: 'pascal',
        expected: 'MyApp',
      },
      {
        description: 'From kebab to PascalCase',
        input: 'kebab-case',
        caseType: 'pascal',
        expected: 'KebabCase',
      },
      {
        description: 'From kebab to PascalCase with special character',
        input: '$kebab-case',
        caseType: 'pascal',
        expected: 'KebabCase',
      },
      {
        description: 'PascalCase special character',
        input: '$CatDog',
        caseType: 'pascal',
        expected: 'CatDog',
      },
      {
        description: 'PascalCase special character',
        input: 'cats? & dogs!',
        caseType: 'pascal',
        expected: 'CatsDogs',
      },
    ];

    tests.forEach((test) => {
      it(test.description, () => {
        expect(normalizeToCase(test.input, test.caseType)).toEqual(test.expected);
      });
    });
  });

});
