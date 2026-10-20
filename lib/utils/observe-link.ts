import { confirm } from '@inquirer/prompts';
import ansis from 'ansis';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import { MESSAGES } from '../ui/index.js';
import { gracefullyExitOnPromptError } from './gracefully-exit-on-prompt-error.js';
import { isInteractive } from './is-interactive.js';

const OBSERVE_PACKAGE = '@nestjs/observe';

/**
 * Offers to link the project to NestJS Observe right away, by running the
 * SDK's own `observe link` - which prints a code to approve in the dashboard
 * and writes the key pair into `.env`. Resolves whether it linked.
 *
 * Only where someone is there to approve it, and only when the installed SDK
 * ships the command: an older one, or `--skip-install`, falls back to the
 * printed next steps.
 */
export const offerObserveLink = async (dir: string): Promise<boolean> => {
  if (!isInteractive()) {
    return false;
  }
  const cwd = join(process.cwd(), dir);
  const bin = join(
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'observe.cmd' : 'observe',
  );
  if (!fs.existsSync(join(cwd, bin))) {
    return false;
  }

  console.info();
  const wantsLink = (await confirm({
    message: MESSAGES.OBSERVABILITY_LINK_QUESTION,
    default: true,
  }).catch(gracefullyExitOnPromptError)) as boolean;
  if (!wantsLink) {
    return false;
  }

  // Run by its path inside the project rather than an absolute one: Windows
  // needs a shell for a `.cmd`, and a shell splits an unquoted path at its
  // first space - `C:\Users\Jane Doe\...`.
  return new Promise<boolean>((resolve) => {
    const child = spawn(bin, ['link'], {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
};

/**
 * The way to connect it later, for when the link didn't happen. `keysHint`
 * is the by-hand alternative, which depends on how the project was wired:
 * `nest new` puts placeholders in `ObserveModule.forRoot()`, while
 * `nest upgrade` reads the pair from the environment.
 */
export const printObservabilityNextSteps = (
  keysHint: string = MESSAGES.OBSERVABILITY_KEYS_HINT,
) => {
  console.info();
  console.info(MESSAGES.OBSERVABILITY_NEXT_STEPS);
  console.info();
  console.info(ansis.bold(MESSAGES.OBSERVABILITY_LINK_COMMAND));
  console.info(ansis.gray(keysHint));
  console.info();
};

/** Whether the project's package.json lists `@nestjs/observe`. */
export const hasObserveDependency = (dir = process.cwd()): boolean => {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(join(dir, 'package.json'), 'utf8'),
    ) as Record<string, Record<string, string> | undefined>;
    return ['dependencies', 'devDependencies'].some(
      (section) => !!pkg[section]?.[OBSERVE_PACKAGE],
    );
  } catch {
    return false;
  }
};
