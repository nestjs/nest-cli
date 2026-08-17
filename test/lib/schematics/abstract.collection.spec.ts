import { describe, expect, it, vi } from 'vitest';
import { AbstractRunner } from '../../../lib/runners/abstract.runner.js';
import { AbstractCollection } from '../../../lib/schematics/abstract.collection.js';
import { SchematicOption } from '../../../lib/schematics/schematic.option.js';

class TestCollection extends AbstractCollection {
  getSchematics() {
    return [{ name: 'test', alias: 't', description: 'Test schematic' }];
  }
}

describe('AbstractCollection', () => {
  it('should build a command line from schematic name and options', async () => {
    const runMock = vi.fn().mockResolvedValue(null);
    const runner = { run: runMock } as unknown as AbstractRunner;
    const collection = new TestCollection('@test/schematics', runner);

    await collection.execute('controller', [
      new SchematicOption('name', 'users'),
    ]);

    expect(runMock).toHaveBeenCalledWith(
      '@test/schematics:controller --name=users',
    );
  });

  it('should concatenate multiple options', async () => {
    const runMock = vi.fn().mockResolvedValue(null);
    const runner = { run: runMock } as unknown as AbstractRunner;
    const collection = new TestCollection('@test/schematics', runner);

    await collection.execute('service', [
      new SchematicOption('name', 'auth'),
      new SchematicOption('flat', true),
      new SchematicOption('spec', false),
    ]);

    expect(runMock).toHaveBeenCalledWith(
      '@test/schematics:service --name=auth --flat --spec=false',
    );
  });

  it('should append extra flags to the command', async () => {
    const runMock = vi.fn().mockResolvedValue(null);
    const runner = { run: runMock } as unknown as AbstractRunner;
    const collection = new TestCollection('@test/schematics', runner);

    await collection.execute(
      'resource',
      [new SchematicOption('name', 'posts')],
      '--dry-run',
    );

    expect(runMock).toHaveBeenCalledWith(
      '@test/schematics:resource --name=posts --dry-run',
    );
  });

  it('should handle empty options array', async () => {
    const runMock = vi.fn().mockResolvedValue(null);
    const runner = { run: runMock } as unknown as AbstractRunner;
    const collection = new TestCollection('@test/schematics', runner);

    await collection.execute('module', []);

    expect(runMock).toHaveBeenCalledWith('@test/schematics:module');
  });

  it('should not append extra flags when undefined', async () => {
    const runMock = vi.fn().mockResolvedValue(null);
    const runner = { run: runMock } as unknown as AbstractRunner;
    const collection = new TestCollection('@test/schematics', runner);

    await collection.execute('guard', [new SchematicOption('name', 'auth')]);

    expect(runMock).toHaveBeenCalledWith(
      '@test/schematics:guard --name=auth',
    );
  });
});
