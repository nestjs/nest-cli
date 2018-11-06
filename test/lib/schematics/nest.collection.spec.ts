import { AbstractRunner } from '../../../lib/runners';
import { NestCollection } from '../../../lib/schematics/nest.collection';

describe('Nest Collection', () => {
  [
    'application',
    'class',
    'controller',
    'decorator',
    'library',
    'filter',
    'gateway',
    'guard',
    'interceptor',
    'middleware',
    'module',
    'pipe',
    'provider',
    'service',
  ].forEach((schematic) => {
    it(`should call runner with ${schematic} schematic name`, async () => {
      const mock = jest.fn();
      mock.mockImplementation(() => {
        return {
          logger: {},
          run: jest.fn().mockImplementation(() => Promise.resolve()),
        };
      });
      const mockedRunner = mock();
      const collection = new NestCollection(mockedRunner as AbstractRunner);
      await collection.execute(schematic, []);
      expect(mockedRunner.run).toHaveBeenCalledWith(
        `@nestjs/schematics:${schematic}`,
      );
    });
  });
  [
    { name: 'application', alias: 'app' },
    { name: 'class', alias: 'cl' },
    { name: 'controller', alias: 'co' },
    { name: 'decorator', alias: 'd' },
    { name: 'library', alias: 'lib' },
    { name: 'filter', alias: 'f' },
    { name: 'gateway', alias: 'ga' },
    { name: 'guard', alias: 'gu' },
    { name: 'interceptor', alias: 'i' },
    { name: 'middleware', alias: 'mi' },
    { name: 'module', alias: 'mo' },
    { name: 'pipe', alias: 'pi' },
    { name: 'provider', alias: 'pr' },
    { name: 'service', alias: 's' },
  ].forEach((schematic) => {
    it(`should call runner with schematic ${schematic.name} name when use ${
      schematic.alias
    } alias`, async () => {
      const mock = jest.fn();
      mock.mockImplementation(() => {
        return {
          logger: {},
          run: jest.fn().mockImplementation(() => Promise.resolve()),
        };
      });
      const mockedRunner = mock();
      const collection = new NestCollection(mockedRunner as AbstractRunner);
      await collection.execute(schematic.alias, []);
      expect(mockedRunner.run).toHaveBeenCalledWith(
        `@nestjs/schematics:${schematic.name}`,
      );
    });
  });
  it('should throw an error when schematic name is not in nest collection', async () => {
    const mock = jest.fn();
    mock.mockImplementation(() => {
      return {
        logger: {},
        run: jest.fn().mockImplementation(() => Promise.resolve()),
      };
    });
    const mockedRunner = mock();
    const collection = new NestCollection(mockedRunner as AbstractRunner);
    try {
      await collection.execute('name', []);
    } catch (error) {
      expect(error.message).toEqual(
        'Invalid schematic "name". Please, ensure that "name" really exists in this collection.',
      );
    }
  });
});
