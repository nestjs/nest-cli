const Schematic = require('../../schematics/schematic');

describe('Schematic', () => {
  it('should return the expected command string when command()', () => {
    const schematic = Schematic
      .Builder()
      .withCollectionName('collection')
      .withSchematicName('schematic')
      .withArgs({ arg1: 'value1' })
      .withOptions({ option1: 'value1' })
      .build();
    expect(schematic.command())
      .toBe('collection:schematic --arg1=value1 --option1=value1 --dry-run=false ');
  });
});
