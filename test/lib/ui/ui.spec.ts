import { describe, expect, it } from 'vitest';
import {
  BANNER,
  CLI_ERRORS,
  EMOJIS,
  ERROR_PREFIX,
  INFO_PREFIX,
  MESSAGES,
} from '../../../lib/ui/index.js';

describe('lib/ui', () => {
  describe('BANNER', () => {
    it('should be a non-empty string', () => {
      expect(typeof BANNER).toBe('string');
      expect(BANNER.length).toBeGreaterThan(0);
    });

    it('should contain characteristic ASCII-art tokens', () => {
      // The banner uses pipe and underscore characters to render the NestJS letters.
      expect(BANNER).toContain('_');
      expect(BANNER).toContain('|');
    });

    it('should span multiple lines', () => {
      expect(BANNER.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('EMOJIS', () => {
    const expectedKeys = [
      'HEART',
      'COFFEE',
      'BEER',
      'BROKEN_HEART',
      'CRYING',
      'HEART_EYES',
      'JOY',
      'KISSING',
      'SCREAM',
      'ROCKET',
      'SMIRK',
      'RAISED_HANDS',
      'POINT_RIGHT',
      'SPARKLES',
      'BOOM',
      'PRAY',
      'WINE',
    ];

    it('should expose all expected emoji keys', () => {
      for (const key of expectedKeys) {
        expect(EMOJIS).toHaveProperty(key);
      }
    });

    it('should expose every emoji as a string', () => {
      for (const key of expectedKeys) {
        const value = (EMOJIS as Record<string, unknown>)[key];
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    });
  });

  describe('CLI_ERRORS', () => {
    it('should expose MISSING_TYPESCRIPT and WRONG_PLUGIN factories', () => {
      expect(typeof CLI_ERRORS.MISSING_TYPESCRIPT).toBe('function');
      expect(typeof CLI_ERRORS.WRONG_PLUGIN).toBe('function');
    });

    it('MISSING_TYPESCRIPT should embed the supplied path', () => {
      const message = CLI_ERRORS.MISSING_TYPESCRIPT('tsconfig.build.json');
      expect(message).toContain('tsconfig.build.json');
      expect(message).toContain('TypeScript configuration file');
      expect(message).toContain('Nest workspace');
    });

    it('WRONG_PLUGIN should embed the supplied plugin name', () => {
      const message = CLI_ERRORS.WRONG_PLUGIN('my-plugin');
      expect(message).toContain('my-plugin');
      expect(message).toContain('not compatible with Nest CLI');
      expect(message).toContain('after()');
      expect(message).toContain('before()');
      expect(message).toContain('afterDeclarations()');
    });
  });

  describe('MESSAGES', () => {
    it('should expose static string messages', () => {
      expect(MESSAGES.PROJECT_NAME_QUESTION).toBe(
        'What name would you like to use for the new project?',
      );
      expect(MESSAGES.PROJECT_SELECTION_QUESTION).toBe(
        'Which project would you like to generate to?',
      );
      expect(MESSAGES.LIBRARY_PROJECT_SELECTION_QUESTION).toBe(
        'Which project would you like to add the library to?',
      );
      expect(MESSAGES.DRY_RUN_MODE).toBe(
        'Command has been executed in dry run mode, nothing changed!',
      );
      expect(MESSAGES.GIT_INITIALIZATION_ERROR).toBe(
        'Git repository has not been initialized',
      );
      expect(MESSAGES.LIBRARY_INSTALLATION_FAILED_NO_LIBRARY).toBe(
        'No library found.',
      );
      expect(MESSAGES.LIBRARY_INSTALLATION_STARTS).toBe(
        'Starting library setup...',
      );
    });

    it('should embed the heart emoji in PACKAGE_MANAGER_QUESTION', () => {
      expect(MESSAGES.PACKAGE_MANAGER_QUESTION).toContain(EMOJIS.HEART);
      expect(MESSAGES.PACKAGE_MANAGER_QUESTION).toContain('package manager');
    });

    it('should embed the coffee emoji in installation progress messages', () => {
      expect(MESSAGES.PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS).toContain(
        EMOJIS.COFFEE,
      );
      expect(MESSAGES.PACKAGE_MANAGER_UPDATE_IN_PROGRESS).toContain(
        EMOJIS.COFFEE,
      );
      expect(MESSAGES.PACKAGE_MANAGER_UPGRADE_IN_PROGRESS).toContain(
        EMOJIS.COFFEE,
      );
      expect(
        MESSAGES.PACKAGE_MANAGER_PRODUCTION_INSTALLATION_IN_PROGRESS,
      ).toContain(EMOJIS.COFFEE);
    });

    it('should embed the sparkles emoji in PROJECT_INFORMATION_START', () => {
      expect(MESSAGES.PROJECT_INFORMATION_START).toContain(EMOJIS.SPARKLES);
      expect(MESSAGES.PROJECT_INFORMATION_START).toContain('scaffold');
    });

    it('should embed the point-right emoji in GET_STARTED_INFORMATION', () => {
      expect(MESSAGES.GET_STARTED_INFORMATION).toContain(EMOJIS.POINT_RIGHT);
      expect(MESSAGES.GET_STARTED_INFORMATION).toContain('Get started');
    });

    it('RUNNER_EXECUTION_ERROR should embed the supplied command', () => {
      const message = MESSAGES.RUNNER_EXECUTION_ERROR('npm run build');
      expect(message).toContain('Failed to execute command');
      expect(message).toContain('npm run build');
    });

    it('PACKAGE_MANAGER_INSTALLATION_SUCCEED should reference the project name', () => {
      const message = MESSAGES.PACKAGE_MANAGER_INSTALLATION_SUCCEED('my-app');
      expect(message).toContain(EMOJIS.ROCKET);
      expect(message).toContain('Successfully created project');
      expect(message).toContain('my-app');
    });

    it('PACKAGE_MANAGER_INSTALLATION_SUCCEED should fall back to a generic message when name is "."', () => {
      const message = MESSAGES.PACKAGE_MANAGER_INSTALLATION_SUCCEED('.');
      expect(message).toContain(EMOJIS.ROCKET);
      expect(message).toContain('Successfully created a new project');
      expect(message).not.toContain('Successfully created project');
    });

    it('CHANGE_DIR_COMMAND should produce a cd command', () => {
      expect(MESSAGES.CHANGE_DIR_COMMAND('my-app')).toBe('$ cd my-app');
    });

    it('START_COMMAND should produce a run start command using the package manager', () => {
      expect(MESSAGES.START_COMMAND('npm')).toBe('$ npm run start');
      expect(MESSAGES.START_COMMAND('pnpm')).toBe('$ pnpm run start');
    });

    it('PACKAGE_MANAGER_INSTALLATION_FAILED should mention manual command and emoji', () => {
      const message =
        MESSAGES.PACKAGE_MANAGER_INSTALLATION_FAILED('npm install');
      expect(message).toContain(EMOJIS.SCREAM);
      expect(message).toContain('Packages installation failed');
      expect(message).toContain('npm install');
    });

    it('NEST_INFORMATION_PACKAGE_MANAGER_FAILED should reference package.json', () => {
      expect(MESSAGES.NEST_INFORMATION_PACKAGE_MANAGER_FAILED).toContain(
        EMOJIS.SMIRK,
      );
      expect(MESSAGES.NEST_INFORMATION_PACKAGE_MANAGER_FAILED).toContain(
        'package.json',
      );
    });

    it('NEST_INFORMATION_PACKAGE_WARNING_FAILED should list every dependency on its own line', () => {
      const deps = [
        '@nestjs/common',
        '@nestjs/core',
        '@nestjs/platform-express',
      ];
      const message = MESSAGES.NEST_INFORMATION_PACKAGE_WARNING_FAILED(deps);
      expect(message).toContain(EMOJIS.SMIRK);
      expect(message).toContain('failed to compare dependencies versions');
      for (const dep of deps) {
        expect(message).toContain(dep);
      }
      expect(message).toContain(deps.join('\n'));
    });

    it('LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE should reference the bad package name', () => {
      const message =
        MESSAGES.LIBRARY_INSTALLATION_FAILED_BAD_PACKAGE('bogus-lib');
      expect(message).toContain('bogus-lib');
      expect(message).toContain('Unable to install library');
    });
  });

  describe('prefixes', () => {
    it('ERROR_PREFIX should be a non-empty string containing the "Error" label', () => {
      expect(typeof ERROR_PREFIX).toBe('string');
      expect(ERROR_PREFIX.length).toBeGreaterThan(0);
      expect(ERROR_PREFIX).toContain('Error');
    });

    it('INFO_PREFIX should be a non-empty string containing the "Info" label', () => {
      expect(typeof INFO_PREFIX).toBe('string');
      expect(INFO_PREFIX.length).toBeGreaterThan(0);
      expect(INFO_PREFIX).toContain('Info');
    });

    it('prefixes should either include ANSI escape codes or fall back to plain labels', () => {
      // ansis emits ESC[ ... m sequences when color support is detected. When tests
      // run without a TTY the library can short-circuit color output, so we accept
      // either an ANSI-coloured string or a plain-text fallback that still carries
      // the label.
      const ansiPattern = /\[[0-9;]*m/;
      const hasColor =
        ansiPattern.test(ERROR_PREFIX) || ansiPattern.test(INFO_PREFIX);
      expect(hasColor || ERROR_PREFIX.includes('Error')).toBe(true);
      expect(hasColor || INFO_PREFIX.includes('Info')).toBe(true);
    });
  });
});
