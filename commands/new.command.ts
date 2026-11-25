import { type Command, InvalidArgumentError } from 'commander';
import { Collection } from '../lib/schematics/collection.js';
import { MESSAGES } from '../lib/ui/index.js';
import {
  AGENT_SKILLS_TARGETS,
  type AgentSkillsTarget,
} from '../lib/utils/agent-skills.js';
import { disablePrompts } from '../lib/utils/is-interactive.js';
import { AbstractCommand } from './abstract.command.js';
import type { NewCommandContext } from './context/index.js';

export class NewCommand extends AbstractCommand {
  public load(program: Command) {
    const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
    const MODULE_TYPES = ['esm', 'cjs'] as const;
    const LANGUAGES: Record<string, string> = {
      typescript: 'ts',
      ts: 'ts',
      javascript: 'js',
      js: 'js',
    };
    const AGENT_SKILLS = Object.keys(
      AGENT_SKILLS_TARGETS,
    ) as AgentSkillsTarget[];

    type PackageManager = (typeof PACKAGE_MANAGERS)[number];
    type ModuleType = (typeof MODULE_TYPES)[number];

    interface NewCommandOptions {
      directory?: string;
      dryRun: boolean;
      skipGit: boolean;
      skipInstall: boolean;
      skipTests: boolean;
      packageManager?: PackageManager;
      language: 'js' | 'ts';
      collection: string;
      strict: true;
      format: boolean;
      observe?: boolean;
      minimal: boolean;
      type: ModuleType;
      interactive: boolean;
      skills?: AgentSkillsTarget[];
      skipSkills: boolean;
    }

    program
      .command('new')
      .alias('n')
      .argument('[name]', 'The name of the new project.')
      .description('Generate Nest application.')
      .option(
        '--directory <directory>',
        'Specify the destination directory',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Directory cannot be empty.');
          return val;
        },
      )
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
        false,
      )
      .option('-g, --skip-git', 'Skip git repository initialization.', false)
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option(
        '-p, --package-manager <packageManager>',
        `Specify package manager. (choices: ${PACKAGE_MANAGERS.map((val) => `'${val}'`).join(', ')})`,
        (val: string) => {
          const packageManager = val.trim().toLowerCase() as PackageManager;
          if (!packageManager)
            throw new InvalidArgumentError('Package Manager cannot be empty.');
          if (!PACKAGE_MANAGERS.includes(packageManager))
            throw new InvalidArgumentError(
              `Allowed choices are ${PACKAGE_MANAGERS.map((val) => `'${val}'`).join(', ')}.`,
            );
          return packageManager;
        },
      )
      .option(
        '-l, --language <language>',
        `Programming language. (choices: ${Object.keys(LANGUAGES)
          .map((val) => `'${val}'`)
          .join(', ')})`,
        (val: string) => {
          const language = val.trim().toLowerCase();
          if (!language)
            throw new InvalidArgumentError('Language cannot be empty.');
          const result = LANGUAGES[language];
          if (!result)
            throw new InvalidArgumentError(
              `Allowed choices are ${Object.keys(LANGUAGES)
                .map((val) => `'${val}'`)
                .join(', ')}.`,
            );
          return result;
        },
        LANGUAGES.typescript,
      )
      .option(
        '-c, --collection <collectionName>',
        'Schematics collection to use',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Collection cannot be empty.');
          return val;
        },
        Collection.NESTJS,
      )
      .option('--strict', 'Enables strict mode in TypeScript.', true)
      .option(
        '-t, --skip-tests',
        'Create the project without tests: no spec or e2e files, no Vitest/Jest config, test scripts or test dependencies. Unlike --minimal, keeps the module, controller and service files.',
        false,
      )
      .option(
        '--type <type>',
        'Module system: `esm` (default, Vitest) or `cjs` (Jest). `--minimal` is ESM-only.',
        (val: string) => {
          const moduleType = val.trim().toLowerCase() as ModuleType;
          if (!moduleType)
            throw new InvalidArgumentError('Module type cannot be empty.');
          if (!MODULE_TYPES.includes(moduleType))
            throw new InvalidArgumentError(
              `Allowed choices are ${MODULE_TYPES.join(', ')}.`,
            );
          return moduleType;
        },
        'esm',
      )
      .option('--format', 'Format generated files using Prettier.', false)
      .option('--observe', 'Auto-configure observability with @nestjs/observe.')
      .option(
        '--no-observe',
        'Skip observability setup without being prompted for it.',
      )
      .option(
        '--minimal',
        'Generate an application whose code is one file, src/main.ts, with no tests, linter or formatter (TypeScript and ESM only).',
        false,
      )
      .option(
        '--no-interactive',
        'Never prompt: use the default for every question not answered by a flag (also the case without a TTY or under CI).',
      )
      .option(
        '--skills <agents>',
        'Coding agents to add the official NestJS agent skills for, comma-separated: all (Codex, Cursor and Claude Code), agents (.agents/skills), claude (.claude/skills), cursor (.cursor/skills), or none.',
        (val: string) => {
          const skills = val
            .split(',')
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean);
          if (skills.length === 0)
            throw new InvalidArgumentError('Agent Skills cannot be empty.');
          if (skills.includes('none')) return [];
          const allowedSet = new Set<string>(AGENT_SKILLS);
          const invalidValues = skills.filter(
            (value) => !allowedSet.has(value),
          );
          if (invalidValues.length > 0)
            throw new InvalidArgumentError(
              `Allowed choices are ${AGENT_SKILLS.join(', ')} (comma-separated), or none.`,
            );
          return [...new Set(skills)] as AgentSkillsTarget[];
        },
      )
      .option('--skip-skills', 'Do not add the NestJS agent skills.', false)
      .action(
        async (
          name: string | undefined,
          options: NewCommandOptions,
          command: Command,
        ) => {
          if (options.minimal && options.type === 'cjs') {
            command.error(`error: ${MESSAGES.MINIMAL_COMMONJS_UNSUPPORTED}`, {
              exitCode: 1,
              code: 'commander.minimalCommonJsUnsupported',
            });
          }

          if (options.interactive === false) {
            disablePrompts();
          }

          if (options.minimal && options.language === 'js') {
            command.error(`error: ${MESSAGES.MINIMAL_JAVASCRIPT_UNSUPPORTED}`, {
              exitCode: 1,
              code: 'commander.minimalJavaScriptUnsupported',
            });
          }

          // Stays undefined unless a flag was given, like `observe`, so the
          // action knows to ask.
          const skills = options.skipSkills
            ? []
            : options.skills && options.skills;

          const context: NewCommandContext = {
            name,
            directory: options.directory,
            dryRun: options.dryRun,
            skipGit: options.skipGit,
            skipInstall: options.skipInstall,
            skipTests: options.skipTests,
            packageManager: options.packageManager,
            language: options.language,
            collection: options.collection,
            strict: options.strict,
            format: options.format === true,
            // Stays undefined unless a flag was given, which is what tells the
            // action to prompt instead of assuming an answer.
            observe: options.observe,
            minimal: options.minimal,
            type: options.type,
            skills,
          };

          await this.action.handle(context);
        },
      );
  }
}
