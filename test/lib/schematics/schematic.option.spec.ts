import { SchematicOption } from '../../../lib/schematics';

describe('Schematic Option', () => {
  [
    {
      description: 'should manage boolean option',
      option: 'dry-run',
      input: false,
      expected: false
    },
    {
      description: 'should manage string option name',
      option: 'name',
      input: 'my-app',
      expected: 'my-app'
    },
    {
      description: 'should manage spaced string option value name',
      option: 'name',
      input: 'my app',
      expected: 'my-app'
    },
    {
      description: 'should manage camelcased string option value name',
      option: 'name',
      input: 'myApp',
      expected: 'my-app'
    },
    {
      description: 'should manage classified string option value name',
      option: 'name',
      input: 'MyApp',
      expected: 'my-app'
    },
    {
      description: 'should manage parenthesis string option value name',
      option: 'name',
      input: 'my-(app)',
      expected: 'my-\\(app\\)'
    },
    {
      description: 'should manage brackets string option value name',
      option: 'name',
      input: 'my-[app]',
      expected: 'my-\\[app\\]'
    },
    {
      description: 'should manage description',
      option: 'description',
      input: 'My super app',
      expected: '"My super app"'
    },
    {
      description: 'should manage author with special chars',
      option: 'author',
      input: 'name <name@example.com>',
      expected: '"name <name@example.com>"'
    },
    {
      description: 'should manage version',
      option: 'version',
      input: '1.0.0',
      expected: '1.0.0'
    }
  ].forEach((test) => {
    it(test.description, () => {
      const option = new SchematicOption(test.option, test.input);
      expect(option.toCommandString()).toEqual(`--${ test.option }=${ test.expected }`);
    });
  });
});
