import { describe, expect, it } from 'vitest';
import { BunRunner } from '../../../lib/runners/bun.runner.js';
import { NpmRunner } from '../../../lib/runners/npm.runner.js';
import { PnpmRunner } from '../../../lib/runners/pnpm.runner.js';
import { Runner } from '../../../lib/runners/runner.js';
import { RunnerFactory } from '../../../lib/runners/runner.factory.js';
import { SchematicRunner } from '../../../lib/runners/schematic.runner.js';
import { YarnRunner } from '../../../lib/runners/yarn.runner.js';

describe('RunnerFactory', () => {
  it('should create a SchematicRunner for Runner.SCHEMATIC', () => {
    const runner = RunnerFactory.create(Runner.SCHEMATIC);
    expect(runner).toBeInstanceOf(SchematicRunner);
  });

  it('should create an NpmRunner for Runner.NPM', () => {
    const runner = RunnerFactory.create(Runner.NPM);
    expect(runner).toBeInstanceOf(NpmRunner);
  });

  it('should create a YarnRunner for Runner.YARN', () => {
    const runner = RunnerFactory.create(Runner.YARN);
    expect(runner).toBeInstanceOf(YarnRunner);
  });

  it('should create a PnpmRunner for Runner.PNPM', () => {
    const runner = RunnerFactory.create(Runner.PNPM);
    expect(runner).toBeInstanceOf(PnpmRunner);
  });

  it('should create a BunRunner for Runner.BUN', () => {
    const runner = RunnerFactory.create(Runner.BUN);
    expect(runner).toBeInstanceOf(BunRunner);
  });

  it('should throw for an unsupported runner', () => {
    expect(() => RunnerFactory.create(999 as Runner)).toThrow(
      'Unsupported runner: 999',
    );
  });

  it('should return a new instance on each call', () => {
    const runner1 = RunnerFactory.create(Runner.NPM);
    const runner2 = RunnerFactory.create(Runner.NPM);
    expect(runner1).not.toBe(runner2);
    expect(runner1).toBeInstanceOf(NpmRunner);
    expect(runner2).toBeInstanceOf(NpmRunner);
  });
});
