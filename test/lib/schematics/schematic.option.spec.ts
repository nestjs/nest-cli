import { SchematicOption } from '../../../lib/schematics';

interface TestOption {
  input: string;
  expected: string;
}

interface TestFlag {
  input: boolean;
}

type TestSuite = {
  description: string;
  option: string;
} & (TestOption | TestFlag);

function isFlagTest(test: any): test is TestFlag {
  return typeof test.expected === 'undefined';
}

describe('Schematic Option', () => {
  const tests: TestSuite[] = [
    {
      description: 'should manage string option name',
      option: 'name',
      input: 'my-app',
      expected: 'my-app',
    },
    {
      description: 'should manage spaced string option value name',
      option: 'name',
      input: 'my app',
      expected: 'my-app',
    },
    {
      description: 'should manage camelcased string option value name',
      option: 'name',
      input: 'myApp',
      expected: 'my-app',
    },
    {
      description: 'should allow underscore string option value name',
      option: 'name',
      input: 'my_app',
      expected: 'my_app',
    },
    {
      description: 'should manage classified string option value name',
      option: 'name',
      input: 'MyApp',
      expected: 'my-app',
    },
    {
      description: 'should manage parenthesis string option value name',
      option: 'name',
      input: 'my-(app)',
      expected: 'my-\\(app\\)',
    },
    {
      description: 'should manage brackets string option value name',
      option: 'name',
      input: 'my-[app]',
      expected: 'my-\\[app\\]',
    },
    {
      description: 'should manage description',
      option: 'description',
      input: 'My super app',
      expected: '"My super app"',
    },
    {
      description: 'should manage author with special chars',
      option: 'author',
      input: 'name <name@example.com>',
      expected: '"name <name@example.com>"',
    },
    {
      description: 'should use "strict" mode',
      option: 'strict',
      input: true,
    },
    {
      description: 'should not use "strict" mode',
      option: 'strict',
      input: false,
    },
    {
      description: 'should manage version',
      option: 'version',
      input: '1.0.0',
      expected: '1.0.0',
    },
    {
      description: 'should manage version',
      option: 'path',
      input: 'path/to/generate',
      expected: 'path/to/generate',
    },
  ];

  tests.forEach((test) => {
    it(test.description, () => {
      const option = new SchematicOption(test.option, test.input);

      if (isFlagTest(test)) {
        if (test.input) {
          expect(option.toCommandString()).toEqual(`--${test.option}`);
        } else {
          expect(option.toCommandString()).toEqual(`--no-${test.option}`);
        }
      } else {
        expect(option.toCommandString()).toEqual(
          `--${test.option}=${test.expected}`,
        );
      }
    });
  });

  it('should should manage boolean option', () => {
    const option = new SchematicOption('dry-run', false);
    expect(option.toCommandString()).toEqual('--no-dry-run');
  });

  it('should keep input name boolean option', () => {
    const keepNameOption = new SchematicOption('noDryRunABcdEfg', true, true);
    expect(keepNameOption.toCommandString()).toEqual('--noDryRunABcdEfg');

    const disableKeepNameOption = new SchematicOption('dry-run', true, false);
    expect(disableKeepNameOption.toCommandString()).toEqual('--dry-run');
  });
});
