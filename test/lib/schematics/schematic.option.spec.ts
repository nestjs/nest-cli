import { SchematicOption } from '../../../lib/schematics';

describe('Schematic Option', () => {
  // it('should manage boolen option', () => {
  //   const option = new SchematicOption('dryRun', false);
  //   expect(option.toCommandString()).toEqual('--dry-run=false');
  // });
  [
    {
      description: 'should manage string option',
      input: false,
      expected: false
    },
    {
      description: 'should manage string option',
      input: 'my-app',
      expected: 'my-app'
    },
    {
      description: 'should manage spaced string option value',
      input: 'my app',
      expected: 'my-app'
    },
    {
      description: 'should manage camelcased string option value',
      input: 'myApp',
      expected: 'my-app'
    },
    {
      description: 'should manage classified string option value',
      input: 'MyApp',
      expected: 'my-app'
    },
    {
      description: 'should manage parenthesis string option value',
      input: 'my-(app)',
      expected: 'my-\\(app\\)'
    },
    {
      description: 'should manage brackets string option value',
      input: 'my-[app]',
      expected: 'my-\\[app\\]'
    }
  ].forEach((test) => {
    it(test.description, () => {
      const option = new SchematicOption('name', test.input);
      expect(option.toCommandString()).toEqual(`--name=${ test.expected }`);
    });
  });
});
