import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(() => '80'),
  spawn: vi.fn(),
}));

vi.mock('fs', async () => {
  const actualFs = await vi.importActual('fs');
  return {
    ...actualFs,
    accessSync: vi.fn(),
    existsSync: vi.fn(() => false),
    promises: {
      writeFile: vi.fn(),
    },
  };
});

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('../../lib/utils/is-interactive.js', () => ({
  isInteractive: vi.fn(() => false),
}));

const mockExecute = vi.fn().mockResolvedValue(undefined);
vi.mock('../../lib/schematics/index.js', async () => {
  const original = await vi.importActual('../../lib/schematics/index.js');
  return {
    ...original,
    CollectionFactory: {
      create: () => ({
        execute: mockExecute,
      }),
    },
  };
});

vi.mock('../../lib/package-managers/index.js', () => ({
  PackageManagerFactory: {
    create: () => ({
      install: vi.fn().mockResolvedValue(undefined),
    }),
  },
  PackageManager: {
    NPM: 'npm',
  },
}));

vi.mock('../../lib/runners/git.runner.js', () => {
  return {
    GitRunner: class {
      run = vi.fn().mockResolvedValue(undefined);
    },
  };
});

import { NewAction, retrieveCols } from '../../actions/new.action.js';
import { NewCommandContext } from '../../commands/context/new.context.js';
import { SchematicOption } from '../../lib/schematics/index.js';
import { execSync, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { join } from 'path';
import { confirm, input, select } from '@inquirer/prompts';
import { isInteractive } from '../../lib/utils/is-interactive.js';

describe('NewAction', () => {
  let action: NewAction;
  const originalExit = process.exit;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn() as any;
    action = new NewAction();
  });

  afterEach(() => {
    process.exit = originalExit;
  });

  const baseContext = (
    overrides: Partial<NewCommandContext> = {},
  ): NewCommandContext => ({
    name: 'test-project',
    directory: undefined,
    dryRun: false,
    skipGit: false,
    skipInstall: true,
    skipTests: false,
    packageManager: 'npm',
    language: 'ts',
    collection: '@nestjs/schematics',
    strict: false,
    // Answered, so only the agent skills cases below prompt or run npx.
    skills: [],
    ...overrides,
  });

  describe('--skip-tests flag', () => {
    it('should pass --spec=false to schematics when --skip-tests is true', async () => {
      const context = baseContext({ skipTests: true });
      await action.handle(context);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [schematicName, schematicOptions] = mockExecute.mock.calls[0];

      expect(schematicName).toBe('application');

      const specOption = schematicOptions.find(
        (opt: SchematicOption) => opt.toCommandString() === '--spec=false',
      );
      expect(specOption).toBeDefined();
    });

    it('should not pass spec option to schematics when --skip-tests is false', async () => {
      const context = baseContext({ skipTests: false });
      await action.handle(context);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [, schematicOptions] = mockExecute.mock.calls[0];

      const specOption = schematicOptions.find(
        (opt: SchematicOption) =>
          opt.toCommandString() === '--spec=false' ||
          opt.toCommandString() === '--spec',
      );
      expect(specOption).toBeUndefined();
    });

    it('should not forward skip-tests as a schematic option', async () => {
      const context = baseContext({ skipTests: true });
      await action.handle(context);

      const [, schematicOptions] = mockExecute.mock.calls[0];

      const skipTestsOption = schematicOptions.find((opt: SchematicOption) =>
        opt.toCommandString().includes('skip-tests'),
      );
      expect(skipTestsOption).toBeUndefined();
    });
  });

  describe('retrieveCols', () => {
    const originalColumns = process.stdout.columns;

    afterEach(() => {
      Object.defineProperty(process.stdout, 'columns', {
        value: originalColumns,
        configurable: true,
        writable: true,
      });
    });

    it('should return process.stdout.columns when set to a positive number', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 132,
        configurable: true,
        writable: true,
      });

      expect(retrieveCols()).toBe(132);
      // tput should never be spawned when stdout.columns is usable.
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should fall back to tput cols when stdout.columns is undefined', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      vi.mocked(execSync).mockReturnValueOnce('120' as any);

      expect(retrieveCols()).toBe(120);
      expect(execSync).toHaveBeenCalledWith('tput cols', expect.any(Object));
    });

    it('should fall back to tput cols when stdout.columns is zero (not a TTY)', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 0,
        configurable: true,
        writable: true,
      });
      vi.mocked(execSync).mockReturnValueOnce('100' as any);

      expect(retrieveCols()).toBe(100);
    });

    it('should return default 80 when neither stdout.columns nor tput is usable', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error('tput: command not found');
      });

      expect(retrieveCols()).toBe(80);
    });
  });

  describe('observability (@nestjs/observe)', () => {
    const observeOption = () => {
      const [, schematicOptions] = mockExecute.mock.calls[0];
      return (schematicOptions as SchematicOption[]).find((opt) =>
        opt.toCommandString().startsWith('--observe'),
      );
    };

    it('forwards --observe to the application schematic when enabled', async () => {
      await action.handle(baseContext({ observe: true }));

      expect(observeOption()?.toCommandString()).toBe('--observe');
    });

    it('sends nothing to the schematic when disabled', async () => {
      await action.handle(baseContext({ observe: false }));

      expect(observeOption()).toBeUndefined();
    });

    it('does not prompt when the flag already answered the question', async () => {
      await action.handle(baseContext({ observe: true }));

      expect(confirm).not.toHaveBeenCalled();
    });

    it('prompts when neither flag was passed and a TTY is available', async () => {
      vi.mocked(isInteractive).mockReturnValue(true);
      vi.mocked(confirm).mockResolvedValue(true as never);

      await action.handle(baseContext({ observe: undefined }));

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(observeOption()?.toCommandString()).toBe('--observe');
    });

    it('points at the signup flow after wiring the SDK up', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});

      await action.handle(baseContext({ observe: true }));

      const printed = info.mock.calls.flat().join('\n');
      expect(printed).toContain('observe.nestjs.com');
      expect(printed).toContain('ObserveModule.forRoot()');
      info.mockRestore();
    });

    it('stays quiet about the signup flow when observe is disabled', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});

      await action.handle(baseContext({ observe: false }));

      expect(info.mock.calls.flat().join('\n')).not.toContain(
        'ObserveModule.forRoot()',
      );
      info.mockRestore();
    });

    it('offers observability as the default answer', async () => {
      vi.mocked(isInteractive).mockReturnValue(true);
      vi.mocked(confirm).mockResolvedValue(true as never);

      await action.handle(baseContext({ observe: undefined }));

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ default: true }),
      );
    });

    it('stays off without a TTY, where nobody can decline', async () => {
      vi.mocked(isInteractive).mockReturnValue(false);
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});

      await action.handle(baseContext({ observe: undefined }));

      expect(confirm).not.toHaveBeenCalled();
      expect(observeOption()).toBeUndefined();
      expect(info).toHaveBeenCalledWith(
        expect.stringContaining('Pass --observe to set it up'),
      );
      info.mockRestore();
    });

    it('respects a declined prompt', async () => {
      vi.mocked(isInteractive).mockReturnValue(true);
      vi.mocked(confirm).mockResolvedValue(false as never);

      await action.handle(baseContext({ observe: undefined }));

      expect(observeOption()).toBeUndefined();
    });

    it('skips the prompt without a TTY so scripted runs cannot hang', async () => {
      // `nest new` is run non-interactively by CI and by the e2e suite; a
      // prompt there would block forever with nobody to answer it.
      vi.mocked(isInteractive).mockReturnValue(false);

      await action.handle(baseContext({ observe: undefined }));

      expect(confirm).not.toHaveBeenCalled();
      expect(observeOption()).toBeUndefined();
    });
  });

  describe('without a TTY', () => {
    const schematicOption = (name: string) => {
      const [, schematicOptions] = mockExecute.mock.calls[0];
      return (schematicOptions as SchematicOption[])
        .find((opt) => opt.toCommandString().startsWith(`--${name}=`))
        ?.toCommandString();
    };

    beforeEach(() => {
      vi.mocked(isInteractive).mockReturnValue(false);
      vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.mocked(console.info).mockRestore();
      vi.unstubAllEnvs();
    });

    it('uses the package manager that started the CLI instead of prompting', async () => {
      vi.stubEnv('npm_config_user_agent', 'pnpm/10.4.0 npm/? node/v24.20.0');

      await action.handle(
        baseContext({ packageManager: undefined, observe: false }),
      );

      expect(select).not.toHaveBeenCalled();
      expect(schematicOption('package-manager')).toContain('pnpm');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--package-manager'),
      );
    });

    it('uses npm when no package manager started the CLI', async () => {
      vi.stubEnv('npm_config_user_agent', undefined);

      await action.handle(
        baseContext({ packageManager: undefined, observe: false }),
      );

      expect(select).not.toHaveBeenCalled();
      expect(schematicOption('package-manager')).toContain('npm');
    });

    it('uses the default project name instead of prompting', async () => {
      await action.handle(baseContext({ name: undefined, observe: false }));

      expect(input).not.toHaveBeenCalled();
      expect(schematicOption('name')).toContain('nest-app');
    });

    it('keeps what the flags already answered, and says nothing about it', async () => {
      await action.handle(baseContext({ observe: false, type: 'esm' }));

      expect(schematicOption('name')).toContain('test-project');
      expect(schematicOption('package-manager')).toContain('npm');
      expect(console.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Not prompting'),
      );
    });

    it("keeps the schematic's own prompts away, saying which defaults they took", async () => {
      await action.handle(baseContext({ observe: false }));

      expect(mockExecute.mock.calls[0][2]).toBe('--no-interactive');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--type esm'),
      );
    });

    it('passes the module system chosen with --type', async () => {
      await action.handle(baseContext({ observe: false, type: 'cjs' }));

      expect(schematicOption('type')).toBe('--type="cjs"');
    });

    it('keeps a minimal application on ESM', async () => {
      await action.handle(baseContext({ observe: false, minimal: true }));

      expect(schematicOption('type')).toBe('--type="esm"');
    });
  });

  describe('with a TTY', () => {
    beforeEach(() => {
      vi.mocked(isInteractive).mockReturnValue(true);
    });

    it('lets the schematic ask its own questions', async () => {
      vi.mocked(confirm).mockResolvedValue(false as never);

      await action.handle(baseContext({ observe: undefined }));

      expect(mockExecute.mock.calls[0][2]).toBeUndefined();
    });

    it('asks for the project name', async () => {
      vi.mocked(input).mockResolvedValue('from-prompt' as never);

      await action.handle(baseContext({ name: undefined, observe: false }));

      expect(input).toHaveBeenCalledTimes(1);
    });

    it('asks for the package manager', async () => {
      vi.mocked(select).mockResolvedValue('yarn' as never);

      await action.handle(
        baseContext({ packageManager: undefined, observe: false }),
      );

      expect(select).toHaveBeenCalledTimes(1);
    });
  });

  describe('linking to NestJS Observe after install', () => {
    const observeBin = join(
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'observe.cmd' : 'observe',
    );

    /** A child process that exits with `code` once it has been spawned. */
    const exitsWith = (code: number) => {
      const child = new EventEmitter();
      setTimeout(() => child.emit('exit', code), 0);
      return child as never;
    };

    const printedLines = () =>
      vi
        .mocked(console.info)
        .mock.calls.flat()
        .map((line) => String(line))
        .join('\n');

    beforeEach(() => {
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.mocked(isInteractive).mockReturnValue(true);
      // Only the installed SDK's bin exists; everything else (.gitignore,
      // the project files) is treated as new.
      vi.mocked(existsSync).mockImplementation((path) =>
        String(path).endsWith(join('test-project', observeBin)),
      );
    });

    afterEach(() => {
      vi.mocked(console.info).mockRestore();
      vi.mocked(existsSync).mockImplementation(() => false);
    });

    it('runs observe link in the new project when the offer is taken', async () => {
      vi.mocked(confirm).mockResolvedValue(true as never);
      vi.mocked(spawn).mockReturnValue(exitsWith(0));

      await action.handle(baseContext({ observe: true, skipInstall: false }));

      // Relative to the project: no part of the command has a space in it,
      // which a Windows shell would split the path at.
      expect(spawn).toHaveBeenCalledWith(
        observeBin,
        ['link'],
        expect.objectContaining({
          cwd: expect.stringContaining('test-project'),
          stdio: 'inherit',
        }),
      );
      // Linked: the paste-the-keys instructions would only confuse.
      expect(printedLines()).not.toContain('ObserveModule.forRoot()');
    });

    it('prints the next steps when the offer is declined', async () => {
      vi.mocked(confirm).mockResolvedValue(false as never);

      await action.handle(baseContext({ observe: true, skipInstall: false }));

      expect(spawn).not.toHaveBeenCalled();
      expect(printedLines()).toContain('npx @nestjs/observe link');
    });

    it('prints the next steps when linking does not finish', async () => {
      vi.mocked(confirm).mockResolvedValue(true as never);
      vi.mocked(spawn).mockReturnValue(exitsWith(1));

      await action.handle(baseContext({ observe: true, skipInstall: false }));

      expect(printedLines()).toContain('npx @nestjs/observe link');
    });

    it('does not offer it when the installed SDK has no link command', async () => {
      // An SDK older than the command: offering would run nothing.
      vi.mocked(existsSync).mockImplementation(() => false);

      await action.handle(baseContext({ observe: true, skipInstall: false }));

      expect(confirm).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
      expect(printedLines()).toContain('npx @nestjs/observe link');
    });

    it('does not offer it without a TTY, or before anything is installed', async () => {
      vi.mocked(isInteractive).mockReturnValue(false);
      await action.handle(baseContext({ observe: true, skipInstall: false }));

      vi.mocked(isInteractive).mockReturnValue(true);
      await action.handle(baseContext({ observe: true, skipInstall: true }));

      expect(confirm).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    });
  });

  describe('--minimal', () => {
    const passedOptions = () =>
      (mockExecute.mock.calls[0][1] as SchematicOption[]).map((option) =>
        option.toCommandString(),
      );

    it('asks the schematic for it, and for ESM so nothing prompts for a module system', async () => {
      await action.handle(baseContext({ minimal: true, observe: false }));

      expect(passedOptions()).toContain('--minimal');
      expect(passedOptions()).toContain('--type="esm"');
    });

    it('leaves a standard project to the schematic', async () => {
      await action.handle(baseContext({ minimal: false, observe: false }));

      expect(passedOptions()).not.toContain('--minimal');
      expect(
        passedOptions().some((option) => option.startsWith('--type')),
      ).toBe(false);
    });

    it('fails when the schematic generated a standard project instead', async () => {
      const appModule = join(
        process.cwd(),
        'test-project',
        'src',
        'app.module.ts',
      );
      vi.mocked(existsSync).mockImplementation((path) => path === appModule);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      await action.handle(
        baseContext({ minimal: true, observe: false, skipInstall: false }),
      );

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(error.mock.calls[0][0]).toContain('does not support --minimal');
      expect(error.mock.calls[0][0]).toContain('test-project');
      error.mockRestore();
      vi.mocked(existsSync).mockReset();
      vi.mocked(existsSync).mockImplementation(() => false);
    });

    it('does not look for files a dry run never wrote', async () => {
      vi.mocked(existsSync).mockImplementation(() => true);

      await action.handle(
        baseContext({ minimal: true, observe: false, dryRun: true }),
      );

      expect(process.exit).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(0);
      vi.mocked(existsSync).mockImplementation(() => false);
    });
  });
  describe('NestJS agent skills', () => {
    const skillsOptions = () =>
      (mockExecute.mock.calls[0][1] as SchematicOption[])
        .map((option) => option.toCommandString())
        .filter((option) => option.startsWith('--skills'));

    const printedLines = () =>
      vi
        .mocked(console.info)
        .mock.calls.flat()
        .map((line) => String(line))
        .join('\n');

    /** A child process that exits with `code` once it has been spawned. */
    const exitsWith = (code: number) => {
      const child = new EventEmitter();
      setTimeout(() => child.emit('exit', code), 0);
      return child as never;
    };

    beforeEach(() => {
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.mocked(spawn).mockReturnValue(exitsWith(0));
    });

    afterEach(() => {
      vi.mocked(console.info).mockRestore();
    });

    describe('the schematic option', () => {
      it('sends each target as its own --skills flag', async () => {
        await action.handle(baseContext({ skills: ['agents', 'cursor'] }));

        expect(skillsOptions()).toEqual([
          '--skills="agents"',
          '--skills="cursor"',
        ]);
      });

      it('sends a lone target twice, the only way schematics-cli makes it an array', async () => {
        await action.handle(baseContext({ skills: ['all'] }));

        expect(skillsOptions()).toEqual(['--skills="all"', '--skills="all"']);
      });

      it('sends nothing for no targets', async () => {
        await action.handle(baseContext({ skills: [] }));

        expect(skillsOptions()).toEqual([]);
      });
    });

    describe('the prompt', () => {
      it('asks with a TTY, offering all by default', async () => {
        vi.mocked(isInteractive).mockReturnValue(true);
        vi.mocked(select).mockResolvedValue('claude' as never);

        await action.handle(baseContext({ skills: undefined, observe: false }));

        expect(select).toHaveBeenCalledTimes(1);
        const question = vi.mocked(select).mock.calls[0][0] as {
          default: string;
          choices: { value: string }[];
        };
        expect(question.default).toBe('all');
        expect(question.choices.map((choice) => choice.value)).toEqual([
          'all',
          'agents',
          'claude',
          'cursor',
          'none',
        ]);
        expect(skillsOptions()).toEqual([
          '--skills="claude"',
          '--skills="claude"',
        ]);
      });

      it('adds none when the answer is none', async () => {
        vi.mocked(isInteractive).mockReturnValue(true);
        vi.mocked(select).mockResolvedValue('none' as never);

        await action.handle(
          baseContext({
            skills: undefined,
            observe: false,
            skipInstall: false,
          }),
        );

        expect(skillsOptions()).toEqual([]);
        expect(spawn).not.toHaveBeenCalled();
      });

      it('adds them for every agent without a TTY, and says so', async () => {
        vi.mocked(isInteractive).mockReturnValue(false);

        await action.handle(baseContext({ skills: undefined }));

        expect(select).not.toHaveBeenCalled();
        expect(skillsOptions()).toEqual(['--skills="all"', '--skills="all"']);
        expect(printedLines()).toContain('--skip-skills');
      });

      it('does not ask when a flag answered', async () => {
        vi.mocked(isInteractive).mockReturnValue(true);

        await action.handle(
          baseContext({ skills: ['cursor'], observe: false }),
        );

        expect(select).not.toHaveBeenCalled();
      });
    });

    describe('the installer', () => {
      it('runs @nestjs/skills in the new project after installing packages', async () => {
        await action.handle(
          baseContext({ skills: ['claude', 'agents'], skipInstall: false }),
        );

        expect(spawn).toHaveBeenCalledWith(
          'npx',
          ['--yes', '@nestjs/skills@latest', 'add', '--agent', 'claude,agents'],
          expect.objectContaining({
            cwd: join(process.cwd(), 'test-project'),
            stdio: 'inherit',
            shell: process.platform === 'win32',
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('runs nothing for no targets', async () => {
        await action.handle(baseContext({ skills: [], skipInstall: false }));

        expect(spawn).not.toHaveBeenCalled();
        expect(printedLines()).not.toContain('@nestjs/skills');
      });

      it('warns with the command to run later when the installer fails, without failing', async () => {
        vi.mocked(spawn).mockReturnValue(exitsWith(1));

        await action.handle(
          baseContext({ skills: ['all'], skipInstall: false }),
        );

        expect(printedLines()).toContain(
          'npx @nestjs/skills@latest add --agent all',
        );
        expect(process.exit).toHaveBeenCalledWith(0);
        expect(process.exit).not.toHaveBeenCalledWith(1);
      });

      it('warns the same way when npx cannot start', async () => {
        const child = new EventEmitter();
        setTimeout(() => child.emit('error', new Error('ENOENT')), 0);
        vi.mocked(spawn).mockReturnValue(child as never);

        await action.handle(
          baseContext({ skills: ['cursor'], skipInstall: false }),
        );

        expect(printedLines()).toContain(
          'npx @nestjs/skills@latest add --agent cursor',
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('skips it with --skip-install, and prints the command instead', async () => {
        await action.handle(
          baseContext({ skills: ['all'], skipInstall: true }),
        );

        expect(spawn).not.toHaveBeenCalled();
        expect(printedLines()).toContain(
          'npx @nestjs/skills@latest add --agent all',
        );
      });

      it('skips it on a dry run, which wrote no project to add them to', async () => {
        await action.handle(
          baseContext({ skills: ['all'], skipInstall: false, dryRun: true }),
        );

        expect(spawn).not.toHaveBeenCalled();
        expect(printedLines()).not.toContain('@nestjs/skills');
      });
    });
  });
});
