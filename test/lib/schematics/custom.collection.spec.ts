import { describe, it, expect, vi } from 'vitest';
import { resolve, dirname } from 'path';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { AbstractRunner } from '../../../lib/runners/index.js';

const require = createRequire(import.meta.url);

// Mock @angular-devkit/schematics/tools to avoid the ora CJS/ESM
// incompatibility that prevents the real module from loading.
// The mock reads collection.json fixtures directly, which is sufficient
// to exercise CustomCollection.getSchematics() extraction logic.
vi.mock('@angular-devkit/schematics/tools/index.js', async () => {
  const fs = await import('fs');
  const path = await import('path');

  function loadCollection(collectionPath: string) {
    const json = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    const baseDescriptions: any[] = [];
    if (json.extends) {
      for (const ext of json.extends) {
        const extPath = path.resolve(path.dirname(collectionPath), ext);
        const extJson = JSON.parse(fs.readFileSync(extPath, 'utf8'));
        baseDescriptions.push({ schematics: extJson.schematics });
      }
    }
    return {
      description: { schematics: json.schematics },
      baseDescriptions,
    };
  }

  return {
    NodeWorkflow: vi.fn().mockImplementation(function () {
      return {
        engine: {
          createCollection: loadCollection,
        },
      };
    }),
  };
});

import { CustomCollection } from '../../../lib/schematics/custom.collection.js';

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

    // Resolve the collection path via the fixture's package.json schematics
    // field, simulating what NodeModulesEngineHost does for bare package names.
    const pkgJsonPath = require.resolve('./fixtures/package/package.json');
    const pkgJson = require(pkgJsonPath);
    const collectionPath = resolve(dirname(pkgJsonPath), pkgJson.schematics);

    const collection = new CustomCollection(
      collectionPath,
      mockedRunner as AbstractRunner,
    );
    const schematics = collection.getSchematics();
    expect(schematics).toEqual([
      { name: 'package1', alias: 'pkg1', description: 'Package schematic 1' },
    ]);
  });
});
