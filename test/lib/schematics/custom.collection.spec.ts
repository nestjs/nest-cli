import { describe, it, expect, vi } from 'vitest';
import { resolve } from 'path';
import { createRequire } from 'module';
import { AbstractRunner } from '../../../lib/runners/index.js';
import { CustomCollection } from '../../../lib/schematics/custom.collection.js';

const require = createRequire(import.meta.url);

describe('Custom Collection', () => {
  it(`should list schematics from simple collection`, async () => {
    const mock = vi.fn();
    mock.mockImplementation(() => {
      return {
        logger: {},
        run: vi.fn().mockImplementation(() => Promise.resolve()),
      };
    });
    const mockedRunner = mock();
    const collection = new CustomCollection(
      require.resolve('./fixtures/simple/collection.json'),
      mockedRunner as AbstractRunner,
    );
    const schematics = collection.getSchematics();
    expect(schematics).toEqual([
      { name: 'simple1', alias: 's1', description: 'Simple schematic 1' },
      { name: 'simple2', alias: 's2', description: 'Simple schematic 2' },
      { name: 'simple3', alias: 's3', description: 'Simple schematic 3' },
    ]);
  });

  it(`should list schematics from extended collection`, async () => {
    const mock = vi.fn();
    mock.mockImplementation(() => {
      return {
        logger: {},
        run: vi.fn().mockImplementation(() => Promise.resolve()),
      };
    });
    const mockedRunner = mock();
    const collection = new CustomCollection(
      require.resolve('./fixtures/extended/collection.json'),
      mockedRunner as AbstractRunner,
    );
    const schematics = collection.getSchematics();
    expect(schematics).toEqual([
      { name: 'extend1', alias: 'x1', description: 'Extended schematic 1' },
      { name: 'extend2', alias: 'x2', description: 'Extended schematic 2' },
      { name: 'simple1', alias: 's1', description: 'Override schematic 1' },
      {
        name: 'simple2',
        alias: 'os2',
        description: 'Override schematic 2',
      },
      {
        name: 'simple3',
        alias: 'simple3',
        description: 'Simple schematic 3',
      },
    ]);
  });

  it(`should list schematics from package with collection.json path in package.json`, async () => {
    const mock = vi.fn();
    mock.mockImplementation(() => {
      return {
        logger: {},
        run: vi.fn().mockImplementation(() => Promise.resolve()),
      };
    });
    const mockedRunner = mock();
    const collection = new CustomCollection(
      'package',
      mockedRunner as AbstractRunner,
    );
    const schematics = collection.getSchematics();
    expect(schematics).toEqual([
      { name: 'package1', alias: 'pkg1', description: 'Package schematic 1' },
    ]);
  });
});
