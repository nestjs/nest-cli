import { describe, expect, it } from 'vitest';
import { BunRunner } from '../../../lib/runners/bun.runner.js';
import { GitRunner } from '../../../lib/runners/git.runner.js';
import { NpmRunner } from '../../../lib/runners/npm.runner.js';
import { PnpmRunner } from '../../../lib/runners/pnpm.runner.js';
import { YarnRunner } from '../../../lib/runners/yarn.runner.js';

describe('Runner Implementations', () => {
  describe('NpmRunner', () => {
    it('should use "npm" as the binary', () => {
      const runner = new NpmRunner();
      expect(runner.rawFullCommand('install')).toContain('npm');
    });

    it('should produce the correct full command', () => {
      const runner = new NpmRunner();
      expect(runner.rawFullCommand('install')).toBe('npm install');
    });
  });

  describe('YarnRunner', () => {
    it('should use "yarn" as the binary', () => {
      const runner = new YarnRunner();
      expect(runner.rawFullCommand('add')).toContain('yarn');
    });

    it('should produce the correct full command', () => {
      const runner = new YarnRunner();
      expect(runner.rawFullCommand('add lodash')).toBe('yarn add lodash');
    });
  });

  describe('PnpmRunner', () => {
    it('should use "pnpm" as the binary', () => {
      const runner = new PnpmRunner();
      expect(runner.rawFullCommand('install')).toContain('pnpm');
    });

    it('should produce the correct full command', () => {
      const runner = new PnpmRunner();
      expect(runner.rawFullCommand('add lodash')).toBe('pnpm add lodash');
    });
  });

  describe('BunRunner', () => {
    it('should use "bun" as the binary', () => {
      const runner = new BunRunner();
      expect(runner.rawFullCommand('install')).toContain('bun');
    });

    it('should produce the correct full command', () => {
      const runner = new BunRunner();
      expect(runner.rawFullCommand('add lodash')).toBe('bun add lodash');
    });
  });

  describe('GitRunner', () => {
    it('should use "git" as the binary', () => {
      const runner = new GitRunner();
      expect(runner.rawFullCommand('init')).toContain('git');
    });

    it('should produce the correct full command', () => {
      const runner = new GitRunner();
      expect(runner.rawFullCommand('init')).toBe('git init');
    });
  });
});
