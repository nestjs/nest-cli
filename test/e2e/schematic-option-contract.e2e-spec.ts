import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SchematicOption } from '../../lib/schematics/schematic.option.js';
import { SchematicRunner } from '../../lib/runners/schematic.runner.js';
import { createTempDir, removeTempDir } from './helpers.js';

/**
 * Pins how the resolved @angular-devkit/schematics-cli actually parses the
 * command strings `SchematicOption` emits.
 *
 * `SchematicOption.toCommandString()` renders a false boolean as
 * `--flag=false`, and it is not free to choose: schematics-cli 21.x parses
 * with node's `parseArgs` under `allowNegative`, which rewrites `--no-flag`
 * into the option `flag` with no value — the CLI then coerces that missing
 * value to `true`, the exact opposite of what was intended. Nothing else in
 * the unit suite records that constraint, so a "cleanup" back to `--no-flag`
 * looks harmless and silently inverts every negative boolean the CLI sends.
 */
describe('SchematicOption ↔ schematics-cli contract (e2e)', () => {
  let tmpDir: string;

  const schematicsBinary = SchematicRunner.findClosestSchematicsBinary();

  /**
   * Run the nest controller schematic in dry-run mode and return the paths it
   * reports creating. Dry run keeps this fast — no install, no writes.
   */
  const runSchematic = (extraArgs: string[]): string[] => {
    const args = [
      '@nestjs/schematics:controller',
      '--name=thing',
      '--source-root=src',
      '--dry-run',
      ...extraArgs,
    ].join(' ');

    const stdout = execSync(`node "${schematicsBinary}" ${args}`, {
      cwd: tmpDir,
      encoding: 'utf-8',
      timeout: 120_000,
    });

    return stdout
      .split('\n')
      .filter((line) => line.includes('CREATE'))
      .map((line) => line.replace(/.*CREATE\s+/, '').replace(/\s+\(.*/, ''));
  };

  beforeEach(() => {
    tmpDir = createTempDir('nest-e2e-schematic-contract-');
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    removeTempDir(tmpDir);
  });

  describe('the form SchematicOption actually emits', () => {
    it('renders a false boolean as --flag=false', () => {
      expect(new SchematicOption('flat', false).toCommandString()).toBe(
        '--flat=false',
      );
    });

    it('renders a true boolean as a bare --flag', () => {
      expect(new SchematicOption('flat', true).toCommandString()).toBe(
        '--flat',
      );
    });

    it('is understood as false by the schematics CLI for "flat"', () => {
      // Generated into a directory => the schematic received flat: false.
      const created = runSchematic([
        new SchematicOption('flat', false).toCommandString(),
      ]);

      expect(created).toContain('thing/thing.controller.ts');
    });

    it('is understood as false by the schematics CLI for "spec"', () => {
      const created = runSchematic([
        new SchematicOption('spec', false).toCommandString(),
      ]);

      expect(created.some((file) => file.endsWith('.controller.ts'))).toBe(
        true,
      );
      expect(created.some((file) => file.includes('.spec.'))).toBe(false);
    });

    it('is understood as true by the schematics CLI for a bare flag', () => {
      const created = runSchematic([
        new SchematicOption('flat', true).toCommandString(),
      ]);

      expect(created).toContain('thing.controller.ts');
    });
  });

  describe('why the --no-flag form must not be used', () => {
    it('does not disable "flat" — it inverts to true', () => {
      const created = runSchematic(['--no-flat']);

      // Flat output: the negation was swallowed and flat became true.
      expect(created).toContain('thing.controller.ts');
      expect(created).not.toContain('thing/thing.controller.ts');
    });

    it('does not disable "spec" — the spec file is still generated', () => {
      const created = runSchematic(['--no-spec']);

      expect(created.some((file) => file.includes('.spec.'))).toBe(true);
    });
  });
});
