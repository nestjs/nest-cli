import { Configuration, ProjectConfiguration } from '../../../lib/configuration';
import {
  shouldAskForProject,
  shouldGenerateSpec,
  shouldGenerateFlat,
  getSpecFileSuffix,
  moveDefaultProjectToStart,
  hasValidOptionFlag,
} from '../../../lib/utils/project-utils';
import { Input } from '../../../commands/command.input';

describe('project-utils', () => {
  describe('shouldAskForProject', () => {
    it('should return false when schematic is "app"', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myApp: { type: 'application' },
      };
      expect(shouldAskForProject('app', projects, '')).toBe(false);
    });

    it('should return false when schematic is "sub-app"', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myApp: { type: 'application' },
      };
      expect(shouldAskForProject('sub-app', projects, '')).toBe(false);
    });

    it('should return false when schematic is "library"', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myLib: { type: 'library' },
      };
      expect(shouldAskForProject('library', projects, '')).toBe(false);
    });

    it('should return false when schematic is "lib"', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myLib: { type: 'library' },
      };
      expect(shouldAskForProject('lib', projects, '')).toBe(false);
    });

    it('should return false when configurationProjects is undefined', () => {
      expect(
        shouldAskForProject('service', undefined as any, ''),
      ).toBeFalsy();
    });

    it('should return false when configurationProjects is empty', () => {
      expect(shouldAskForProject('service', {}, '')).toBeFalsy();
    });

    it('should return false when appName is provided', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myApp: { type: 'application' },
      };
      expect(shouldAskForProject('service', projects, 'myApp')).toBeFalsy();
    });

    it('should return true when schematic is not app/sub-app/library/lib, projects exist, and no appName', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myApp: { type: 'application' },
      };
      expect(shouldAskForProject('service', projects, '')).toBe(true);
    });

    it('should return true for "controller" schematic with projects and no appName', () => {
      const projects: { [key: string]: ProjectConfiguration } = {
        myApp: { type: 'application' },
        myLib: { type: 'library' },
      };
      expect(shouldAskForProject('controller', projects, '')).toBe(true);
    });
  });

  describe('shouldGenerateSpec', () => {
    const baseConfiguration: Required<Configuration> = {
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

    it('should return the specValue when specPassedAsInput is true', () => {
      expect(
        shouldGenerateSpec(baseConfiguration, 'service', '', true, true),
      ).toBe(true);
      expect(
        shouldGenerateSpec(baseConfiguration, 'service', '', false, true),
      ).toBe(false);
    });

    it('should return the specValue when specPassedAsInput is undefined', () => {
      expect(
        shouldGenerateSpec(baseConfiguration, 'service', '', true, undefined),
      ).toBe(true);
      expect(
        shouldGenerateSpec(baseConfiguration, 'service', '', false, undefined),
      ).toBe(false);
    });

    it('should use configuration boolean spec when specPassedAsInput is false', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          spec: false,
        },
      };
      expect(shouldGenerateSpec(config, 'service', '', true, false)).toBe(
        false,
      );
    });

    it('should use configuration boolean spec=true when specPassedAsInput is false', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          spec: true,
        },
      };
      expect(shouldGenerateSpec(config, 'service', '', false, false)).toBe(
        true,
      );
    });

    it('should use schematic-specific spec configuration when available', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          spec: {
            service: false,
            controller: true,
          },
        },
      };
      expect(shouldGenerateSpec(config, 'service', '', true, false)).toBe(
        false,
      );
      expect(shouldGenerateSpec(config, 'controller', '', false, false)).toBe(
        true,
      );
    });

    it('should fall back to specValue when schematic not found in spec object', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          spec: {
            service: false,
          },
        },
      };
      expect(shouldGenerateSpec(config, 'module', '', true, false)).toBe(true);
    });

    it('should use project-specific generateOptions.spec when appName is provided', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        monorepo: true,
        projects: {
          myApp: {
            compilerOptions: {},
          },
        },
        generateOptions: {
          spec: true,
        },
      };
      // When the project exists but has no generateOptions, it falls through
      // to the global configuration
      expect(shouldGenerateSpec(config, 'service', 'myApp', false, false)).toBe(
        true,
      );
    });

    it('should fall back to global spec object when appName has spec object but not for given schematic', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        monorepo: true,
        projects: {
          myApp: {
            compilerOptions: {},
          },
        },
        generateOptions: {
          spec: {
            service: false,
          },
        },
      };
      expect(
        shouldGenerateSpec(config, 'service', 'myApp', true, false),
      ).toBe(false);
    });
  });

  describe('shouldGenerateFlat', () => {
    const baseConfiguration: Required<Configuration> = {
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

    it('should return true when flatValue is true (CLI has highest priority)', () => {
      expect(shouldGenerateFlat(baseConfiguration, '', true)).toBe(true);
    });

    it('should use configuration flat value when flatValue is false', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          flat: true,
        },
      };
      expect(shouldGenerateFlat(config, '', false)).toBe(true);
    });

    it('should return false when both configuration and CLI flat are false', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          flat: false,
        },
      };
      expect(shouldGenerateFlat(config, '', false)).toBe(false);
    });

    it('should return false when no configuration flat is set and flatValue is false', () => {
      expect(shouldGenerateFlat(baseConfiguration, '', false)).toBe(false);
    });
  });

  describe('getSpecFileSuffix', () => {
    const baseConfiguration: Required<Configuration> = {
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

    it('should return CLI value when specFileSuffixValue is provided', () => {
      expect(getSpecFileSuffix(baseConfiguration, '', 'test')).toBe('test');
    });

    it('should return CLI value even when configuration has a different value', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          specFileSuffix: 'integration',
        },
      };
      expect(getSpecFileSuffix(config, '', 'test')).toBe('test');
    });

    it('should use configuration specFileSuffix when CLI value is empty', () => {
      const config: Required<Configuration> = {
        ...baseConfiguration,
        generateOptions: {
          specFileSuffix: 'integration',
        },
      };
      expect(getSpecFileSuffix(config, '', '')).toBe('integration');
    });

    it('should return "spec" as default when no CLI value and no configuration', () => {
      // The function passes 'spec' as defaultValue to getValueOrDefault
      expect(getSpecFileSuffix(baseConfiguration, '', '')).toBe('spec');
    });
  });

  describe('moveDefaultProjectToStart', () => {
    it('should prepend the default project name to the projects list', () => {
      const config: Configuration = {
        sourceRoot: 'src',
        projects: {
          app1: { type: 'application' },
          app2: { type: 'application' },
          lib1: { type: 'library' },
        },
      };
      const result = moveDefaultProjectToStart(config, 'default-app', '');
      expect(result[0]).toBe('default-app');
      expect(result).toContain('app1');
      expect(result).toContain('app2');
      expect(result).toContain('lib1');
    });

    it('should return only the default project name when projects is null', () => {
      const config: Configuration = {
        sourceRoot: 'src',
        projects: undefined,
      };
      const result = moveDefaultProjectToStart(config, 'default-app', '');
      expect(result).toEqual(['default-app']);
    });

    it('should filter out the project matching defaultProjectName minus defaultLabel when sourceRoot is not "src"', () => {
      const config: Configuration = {
        sourceRoot: 'apps/myapp/src',
        projects: {
          myapp: { type: 'application' },
          lib1: { type: 'library' },
        },
      };
      const result = moveDefaultProjectToStart(
        config,
        'myapp [DEFAULT]',
        ' [DEFAULT]',
      );
      expect(result[0]).toBe('myapp [DEFAULT]');
      // 'myapp' should be filtered out since sourceRoot !== 'src'
      // and 'myapp [DEFAULT]'.replace(' [DEFAULT]', '') === 'myapp'
      expect(result.filter((p) => p === 'myapp')).toHaveLength(0);
      expect(result).toContain('lib1');
    });

    it('should not filter projects when sourceRoot is "src"', () => {
      const config: Configuration = {
        sourceRoot: 'src',
        projects: {
          myapp: { type: 'application' },
          lib1: { type: 'library' },
        },
      };
      const result = moveDefaultProjectToStart(
        config,
        'myapp [DEFAULT]',
        ' [DEFAULT]',
      );
      expect(result[0]).toBe('myapp [DEFAULT]');
      // 'myapp' should NOT be filtered out since sourceRoot === 'src'
      expect(result).toContain('myapp');
      expect(result).toContain('lib1');
    });

    it('should handle empty projects object', () => {
      const config: Configuration = {
        sourceRoot: 'src',
        projects: {},
      };
      const result = moveDefaultProjectToStart(config, 'default-app', '');
      expect(result).toEqual(['default-app']);
    });
  });

  describe('hasValidOptionFlag', () => {
    const options: Input[] = [
      { name: 'dry-run', value: true },
      { name: 'project', value: 'my-app' },
      { name: 'flat', value: false },
      { name: 'spec', value: true },
    ];

    it('should return true when option exists with default queriedValue (true)', () => {
      expect(hasValidOptionFlag('dry-run', options)).toBe(true);
    });

    it('should return true when option exists with matching queriedValue', () => {
      expect(hasValidOptionFlag('project', options, 'my-app')).toBe(true);
    });

    it('should return false when option exists but value does not match', () => {
      expect(hasValidOptionFlag('project', options, 'other-app')).toBe(false);
    });

    it('should return false when option name does not exist', () => {
      expect(hasValidOptionFlag('non-existent', options)).toBe(false);
    });

    it('should return false when querying for true but value is false', () => {
      expect(hasValidOptionFlag('flat', options)).toBe(false);
    });

    it('should return true when querying for false and value is false', () => {
      expect(hasValidOptionFlag('flat', options, false)).toBe(true);
    });

    it('should handle empty options array', () => {
      expect(hasValidOptionFlag('anything', [])).toBe(false);
    });

    it('should handle string value matching', () => {
      const stringOptions: Input[] = [
        { name: 'collection', value: '@nestjs/schematics' },
      ];
      expect(
        hasValidOptionFlag('collection', stringOptions, '@nestjs/schematics'),
      ).toBe(true);
      expect(
        hasValidOptionFlag('collection', stringOptions, '@other/schematics'),
      ).toBe(false);
    });
  });
});
