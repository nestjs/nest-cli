import { describe, expect, it, vi } from 'vitest';
import { loadConfiguration } from '../../../lib/utils/load-configuration.js';

// Mock the NestConfigurationLoader to avoid filesystem access
vi.mock('../../../lib/configuration/nest-configuration.loader.js', () => {
  return {
    NestConfigurationLoader: class {
      load() {
        return {
          language: 'ts',
          sourceRoot: 'src',
          collection: '@nestjs/schematics',
          entryFile: 'main',
          exec: 'node',
          projects: {},
          monorepo: false,
          compilerOptions: {},
          generateOptions: {},
        };
      }
    },
  };
});

vi.mock('../../../lib/readers/index.js', () => {
  return {
    FileSystemReader: class {
      constructor() {}
    },
  };
});

describe('loadConfiguration', () => {
  it('should return a configuration object', async () => {
    const config = await loadConfiguration();
    expect(config).toBeDefined();
    expect(config.language).toBe('ts');
    expect(config.sourceRoot).toBe('src');
  });

  it('should return default entry file', async () => {
    const config = await loadConfiguration();
    expect(config.entryFile).toBe('main');
  });

  it('should return default collection', async () => {
    const config = await loadConfiguration();
    expect(config.collection).toBe('@nestjs/schematics');
  });

  it('should return an object with all required configuration fields', async () => {
    const config = await loadConfiguration();
    expect(config).toHaveProperty('language');
    expect(config).toHaveProperty('sourceRoot');
    expect(config).toHaveProperty('collection');
    expect(config).toHaveProperty('entryFile');
    expect(config).toHaveProperty('exec');
    expect(config).toHaveProperty('projects');
    expect(config).toHaveProperty('monorepo');
    expect(config).toHaveProperty('compilerOptions');
    expect(config).toHaveProperty('generateOptions');
  });
});
