import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.fn().mockResolvedValue(undefined);

vi.mock('../../lib/schematics/index.js', async () => {
  const original = await vi.importActual('../../lib/schematics/index.js');
  return {
    ...original,
    CollectionFactory: { create: vi.fn(() => ({ execute })) },
  };
});

vi.mock('../../lib/utils/load-configuration.js', () => ({
  loadConfiguration: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../lib/utils/is-interactive.js', () => ({
  isInteractive: vi.fn(() => true),
}));

import { UpgradeAction } from '../../actions/upgrade.action.js';
import { UpgradeCommandContext } from '../../commands/index.js';
import {
  CollectionFactory,
  SchematicOption,
} from '../../lib/schematics/index.js';
import { MESSAGES } from '../../lib/ui/index.js';
import { isInteractive } from '../../lib/utils/is-interactive.js';
import { loadConfiguration } from '../../lib/utils/load-configuration.js';

describe('UpgradeAction', () => {
  let action: UpgradeAction;

  const context = (
    overrides: Partial<UpgradeCommandContext> = {},
  ): UpgradeCommandContext => ({
    dryRun: false,
    skipInstall: false,
    ...overrides,
  });

  // Options are asserted through the strings schematics-cli receives so the
  // test also guards the `--flag` / `--flag=false` rendering that matters.
  const executedOptions = (): string[] => {
    expect(execute).toHaveBeenCalledTimes(1);
    const [name, options] = execute.mock.calls[0] as [
      string,
      SchematicOption[],
    ];
    expect(name).toBe('upgrade');
    return options.map((option) => option.toCommandString());
  };

  beforeEach(() => {
    vi.clearAllMocks();
    execute.mockResolvedValue(undefined);
    vi.mocked(isInteractive).mockReturnValue(true);
    vi.mocked(loadConfiguration).mockResolvedValue({} as never);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    action = new UpgradeAction();
  });

  describe('collection selection', () => {
    it('defaults to @nestjs/schematics', async () => {
      await action.handle(context());

      expect(CollectionFactory.create).toHaveBeenCalledWith(
        '@nestjs/schematics',
      );
    });

    it('uses the collection from nest-cli.json when configured', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        collection: '@acme/schematics',
      } as never);

      await action.handle(context());

      expect(CollectionFactory.create).toHaveBeenCalledWith('@acme/schematics');
    });

    it('prefers an explicit --collection over the configuration', async () => {
      vi.mocked(loadConfiguration).mockResolvedValue({
        collection: '@acme/schematics',
      } as never);

      await action.handle(context({ collection: '@other/schematics' }));

      expect(CollectionFactory.create).toHaveBeenCalledWith(
        '@other/schematics',
      );
    });
  });

  describe('schematic options', () => {
    it('passes no options by default in an interactive session', async () => {
      await action.handle(context());

      expect(executedOptions()).toEqual([]);
    });

    it('forwards --skip-install', async () => {
      await action.handle(context({ skipInstall: true }));

      expect(executedOptions()).toEqual(['--skip-install']);
    });

    it('forwards --tag', async () => {
      await action.handle(context({ tag: 'next' }));

      expect(executedOptions()).toEqual(['--tag="next"']);
    });

    it('forwards --dry-run', async () => {
      await action.handle(context({ dryRun: true }));

      expect(executedOptions()).toEqual(['--dry-run']);
    });
  });

  describe('observe', () => {
    it('forwards --observe for an explicit opt-in', async () => {
      await action.handle(context({ observe: true }));

      expect(executedOptions()).toEqual(['--observe']);
    });

    it('forwards --observe=false for an explicit opt-out', async () => {
      await action.handle(context({ observe: false }));

      expect(executedOptions()).toEqual(['--observe=false']);
    });

    it('leaves the option out when unset so the schematic can prompt', async () => {
      await action.handle(context({ observe: undefined }));

      expect(executedOptions()).not.toContainEqual(
        expect.stringContaining('observe'),
      );
    });

    it('answers the prompt with false when there is no TTY', async () => {
      vi.mocked(isInteractive).mockReturnValue(false);

      await action.handle(context({ observe: undefined }));

      expect(executedOptions()).toEqual(['--observe=false']);
    });

    it('keeps an explicit choice even without a TTY', async () => {
      vi.mocked(isInteractive).mockReturnValue(false);

      await action.handle(context({ observe: true }));

      expect(executedOptions()).toEqual(['--observe']);
    });
  });

  describe('output', () => {
    it('announces the upgrade before running the schematic', async () => {
      await action.handle(context());

      expect(console.info).toHaveBeenCalledWith(MESSAGES.UPGRADE_IN_PROGRESS);
    });

    it('reminds the user to update a globally installed CLI', async () => {
      await action.handle(context());

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('npm i -g @nestjs/cli@latest'),
      );
    });

    it('prints the dry-run notice instead of the global CLI hint', async () => {
      await action.handle(context({ dryRun: true }));

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(MESSAGES.DRY_RUN_MODE),
      );
      expect(console.info).not.toHaveBeenCalledWith(
        expect.stringContaining('npm i -g @nestjs/cli@latest'),
      );
    });
  });

  describe('failures', () => {
    it('logs and rethrows when the schematic fails', async () => {
      execute.mockRejectedValue(new Error('Node.js v20.19 or newer required'));

      await expect(action.handle(context())).rejects.toThrow(
        'Node.js v20.19 or newer required',
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Node.js v20.19 or newer required'),
      );
      expect(console.info).not.toHaveBeenCalledWith(
        expect.stringContaining('npm i -g @nestjs/cli@latest'),
      );
    });

    it('rethrows non-Error rejections untouched', async () => {
      execute.mockRejectedValue(undefined);

      await expect(action.handle(context())).rejects.toBeUndefined();
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
