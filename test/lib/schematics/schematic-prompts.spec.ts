import { describe, expect, it } from 'vitest';
import {
  describeSkippedPrompt,
  getSkippedPrompts,
} from '../../../lib/schematics/schematic-prompts.js';
import { SchematicOption } from '../../../lib/schematics/schematic.option.js';

describe('getSkippedPrompts', () => {
  it("lists the resource schematic's open questions with their defaults", async () => {
    const skipped = await getSkippedPrompts('@nestjs/schematics', 'resource', [
      new SchematicOption('name', 'users'),
    ]);

    expect(skipped).toEqual([
      { name: 'type', default: 'rest' },
      { name: 'crud', default: true },
    ]);
  });

  it('leaves out what the options answered, matching camelCase to kebab-case', async () => {
    const skipped = await getSkippedPrompts('@nestjs/schematics', 'res', [
      new SchematicOption('name', 'users'),
      new SchematicOption('type', 'ws'),
      new SchematicOption('crud', false),
    ]);

    expect(skipped).toEqual([]);
  });

  it('includes a question without a default', async () => {
    const skipped = await getSkippedPrompts(
      '@nestjs/schematics',
      'resource',
      [],
    );

    expect(skipped).toContainEqual({ name: 'name', default: undefined });
  });

  it('is empty for a collection that cannot be resolved', async () => {
    expect(
      await getSkippedPrompts('@not-installed/schematics', 'resource', []),
    ).toEqual([]);
  });
});

describe('describeSkippedPrompt', () => {
  it.each([
    [{ name: 'type', default: 'rest' }, '--type rest'],
    [{ name: 'crud', default: true }, '--crud'],
    [{ name: 'skipImport', default: false }, '--no-skip-import'],
    [{ name: 'prefix' }, "--prefix (the schematic's own default)"],
  ])('describes %o as %s', (prompt, expected) => {
    expect(describeSkippedPrompt(prompt)).toBe(expected);
  });
});
