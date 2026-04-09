import { Configuration, ProjectConfiguration } from '../../../lib/configuration';
import {
  shouldAskForProject,
  shouldGenerateSpec,
  shouldGenerateFlat,
  getSpecFileSuffix,
  moveDefaultProjectToStart,
} from '../../../lib/utils/project-utils';

function createConfig(
  overrides: Partial<Configuration> = {},
): Required<Configuration> {
  return {
    language: 'ts',
    sourceRoot: 'src',
    collection: '@nestjs/schematics',
    entryFile: 'main',
    exec: 'node',
    projects: {},
    monorepo: false,
    compilerOptions: {
      builder: 'tsc',
      webpack: false,
      plugins: [],
      assets: [],
      manualRestart: false,
    },
    generateOptions: {},
    ...overrides,
  } as Required<Configuration>;
}

describe('shouldAskForProject', () => {
  const projects: Record<string, ProjectConfiguration> = {
    app1: { compilerOptions: {} },
    app2: { compilerOptions: {} },
  };

  it('should return false for "app" schematic', () => {
    expect(shouldAskForProject('app', projects, '')).toBe(false);
  });

  it('should return false for "sub-app" schematic', () => {
    expect(shouldAskForProject('sub-app', projects, '')).toBe(false);
  });

  it('should return false for "library" schematic', () => {
    expect(shouldAskForProject('library', projects, '')).toBe(false);
  });

  it('should return false for "lib" schematic', () => {
    expect(shouldAskForProject('lib', projects, '')).toBe(false);
  });

  it('should return false when no projects exist', () => {
    expect(shouldAskForProject('service', {}, '')).toBe(false);
  });

  it('should return false when appName is provided', () => {
    expect(shouldAskForProject('service', projects, 'app1')).toBe(false);
  });

  it('should return true for non-excluded schematic with projects and no appName', () => {
    expect(shouldAskForProject('service', projects, '')).toBe(true);
  });
});

describe('shouldGenerateSpec', () => {
  it('should return specValue when specPassedAsInput is true', () => {
    const config = createConfig();
    expect(shouldGenerateSpec(config, 'service', '', true, true)).toBe(true);
    expect(shouldGenerateSpec(config, 'service', '', false, true)).toBe(false);
  });

  it('should return specValue when specPassedAsInput is undefined', () => {
    const config = createConfig();
    expect(shouldGenerateSpec(config, 'service', '', true, undefined)).toBe(
      true,
    );
  });

  it('should use configuration boolean spec when specPassedAsInput is false', () => {
    const config = createConfig({ generateOptions: { spec: false } });
    expect(shouldGenerateSpec(config, 'service', '', true, false)).toBe(false);
  });

  it('should use per-schematic spec from configuration', () => {
    const config = createConfig({
      generateOptions: { spec: { service: false, controller: true } },
    });
    expect(shouldGenerateSpec(config, 'service', '', true, false)).toBe(false);
    expect(shouldGenerateSpec(config, 'controller', '', true, false)).toBe(
      true,
    );
  });

  it('should fall back to specValue when no matching config exists', () => {
    const config = createConfig();
    expect(shouldGenerateSpec(config, 'service', '', true, false)).toBe(true);
  });
});

describe('shouldGenerateFlat', () => {
  it('should return true when flatValue is true', () => {
    const config = createConfig();
    expect(shouldGenerateFlat(config, '', true)).toBe(true);
  });

  it('should use configuration flat when flatValue is false', () => {
    const config = createConfig({ generateOptions: { flat: true } });
    expect(shouldGenerateFlat(config, '', false)).toBe(true);
  });

  it('should return false when both flatValue and config are false', () => {
    const config = createConfig({ generateOptions: { flat: false } });
    expect(shouldGenerateFlat(config, '', false)).toBe(false);
  });
});

describe('getSpecFileSuffix', () => {
  it('should return provided suffix value over configuration', () => {
    const config = createConfig({
      generateOptions: { specFileSuffix: 'test' },
    });
    expect(getSpecFileSuffix(config, '', 'custom')).toBe('custom');
  });

  it('should use configuration suffix when no value provided', () => {
    const config = createConfig({
      generateOptions: { specFileSuffix: 'test' },
    });
    expect(getSpecFileSuffix(config, '', '')).toBe('test');
  });

  it('should default to "spec" when nothing is configured', () => {
    const config = createConfig();
    expect(getSpecFileSuffix(config, '', '')).toBe('spec');
  });
});

describe('moveDefaultProjectToStart', () => {
  it('should prepend default project to the list', () => {
    const config = createConfig({
      projects: {
        app1: { compilerOptions: {} },
        app2: { compilerOptions: {} },
      },
    });
    const result = moveDefaultProjectToStart(config, 'app1 [ Default ]', ' [ Default ]');
    expect(result[0]).toBe('app1 [ Default ]');
  });

  it('should filter duplicate when sourceRoot is not src', () => {
    const config = createConfig({
      sourceRoot: 'apps/main/src',
      projects: {
        main: { compilerOptions: {} },
        other: { compilerOptions: {} },
      },
    });
    const result = moveDefaultProjectToStart(
      config,
      'main [ Default ]',
      ' [ Default ]',
    );
    expect(result[0]).toBe('main [ Default ]');
    // 'main' should be filtered from the remaining list since sourceRoot !== 'src'
    expect(result.filter((p) => p === 'main').length).toBe(0);
  });
});
