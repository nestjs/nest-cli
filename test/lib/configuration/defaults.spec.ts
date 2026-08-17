import { describe, expect, it } from 'vitest';
import {
  defaultConfiguration,
  defaultGitIgnore,
  defaultOutDir,
  defaultRspackConfigFilename,
  defaultTsconfigFilename,
  defaultWebpackConfigFilename,
} from '../../../lib/configuration/defaults.js';

describe('Configuration Defaults', () => {
  describe('defaultConfiguration', () => {
    it('should use TypeScript as the default language', () => {
      expect(defaultConfiguration.language).toBe('ts');
    });

    it('should use src as the default source root', () => {
      expect(defaultConfiguration.sourceRoot).toBe('src');
    });

    it('should use @nestjs/schematics as the default collection', () => {
      expect(defaultConfiguration.collection).toBe('@nestjs/schematics');
    });

    it('should use main as the default entry file', () => {
      expect(defaultConfiguration.entryFile).toBe('main');
    });

    it('should use node as the default exec', () => {
      expect(defaultConfiguration.exec).toBe('node');
    });

    it('should have empty projects by default', () => {
      expect(defaultConfiguration.projects).toEqual({});
    });

    it('should not be a monorepo by default', () => {
      expect(defaultConfiguration.monorepo).toBe(false);
    });

    it('should use tsc as the default builder', () => {
      expect(defaultConfiguration.compilerOptions.builder).toEqual(
        expect.objectContaining({ type: 'tsc' }),
      );
    });

    it('should have webpack disabled by default', () => {
      expect(defaultConfiguration.compilerOptions.webpack).toBe(false);
    });

    it('should have empty plugins by default', () => {
      expect(defaultConfiguration.compilerOptions.plugins).toEqual([]);
    });

    it('should have empty assets by default', () => {
      expect(defaultConfiguration.compilerOptions.assets).toEqual([]);
    });

    it('should have manual restart disabled by default', () => {
      expect(defaultConfiguration.compilerOptions.manualRestart).toBe(false);
    });

    it('should have empty generate options by default', () => {
      expect(defaultConfiguration.generateOptions).toEqual({});
    });
  });

  describe('default filenames', () => {
    it('should define a default tsconfig filename', () => {
      expect(defaultTsconfigFilename).toBeDefined();
      expect(typeof defaultTsconfigFilename).toBe('string');
    });

    it('should use webpack.config.js as the default webpack config', () => {
      expect(defaultWebpackConfigFilename).toBe('webpack.config.js');
    });

    it('should use rspack.config.js as the default rspack config', () => {
      expect(defaultRspackConfigFilename).toBe('rspack.config.js');
    });

    it('should use dist as the default output directory', () => {
      expect(defaultOutDir).toBe('dist');
    });
  });

  describe('defaultGitIgnore', () => {
    it('should include common directories to ignore', () => {
      expect(defaultGitIgnore).toContain('/dist');
      expect(defaultGitIgnore).toContain('/node_modules');
      expect(defaultGitIgnore).toContain('.DS_Store');
    });

    it('should include dotenv files', () => {
      expect(defaultGitIgnore).toContain('.env');
    });

    it('should include IDE directories', () => {
      expect(defaultGitIgnore).toContain('/.idea');
      expect(defaultGitIgnore).toContain('.vscode');
    });
  });
});
