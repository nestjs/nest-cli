import ansis from 'ansis';
import { spawn } from 'child_process';
import { join } from 'path';
import { MESSAGES } from '../ui/index.js';

/**
 * Where coding agents load project skills from, under the names the
 * `@nestjs/skills` installer gives them (`npx @nestjs/skills add --agent
 * <name>`). `all` covers Codex, Cursor and Claude Code at once.
 */
export const AGENT_SKILLS_TARGETS = {
  all: '.agents/skills + .claude/skills (Codex, Cursor and Claude Code)',
  agents: '.agents/skills (Codex, Cursor)',
  claude: '.claude/skills (Claude Code)',
  cursor: '.cursor/skills (Cursor)',
} as const;

export type AgentSkillsTarget = keyof typeof AGENT_SKILLS_TARGETS;

/** What `nest new` installs when nobody is there to ask. */
export const DEFAULT_AGENT_SKILLS: AgentSkillsTarget[] = ['all'];

/**
 * Reads the `--skills` flag: targets separated by commas (`claude,agents`),
 * or `none`. Throws on a name the installer doesn't know, so a typo fails
 * before anything is generated.
 */
export const parseAgentSkills = (value: string): AgentSkillsTarget[] => {
  const names = value
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  if (names.length === 1 && names[0] === 'none') {
    return [];
  }
  const known = Object.keys(AGENT_SKILLS_TARGETS);
  for (const name of names) {
    if (!known.includes(name)) {
      throw new Error(
        `Invalid skills target "${name}". Use ${known.join(', ')} (comma-separated), or none.`,
      );
    }
  }
  return [...new Set(names)] as AgentSkillsTarget[];
};

const SKILLS_PACKAGE = '@nestjs/skills@latest';

/** The installer command, as the user would type it. */
export const agentSkillsCommand = (targets: AgentSkillsTarget[]) =>
  `npx ${SKILLS_PACKAGE} add --agent ${targets.join(',')}`;

/**
 * Installs the official NestJS agent skills into the new project by running
 * the `@nestjs/skills` installer, which copies them into each target folder
 * and marks them so a later `add` updates them and `remove` removes them.
 * The skills ship apart from the CLI and the schematics, so a new release
 * reaches new projects without either being released.
 *
 * Never fails `nest new`: when the installer can't run (offline, say), it
 * prints the command to run later and resolves `false`.
 */
export const installAgentSkills = async (
  dir: string,
  targets: AgentSkillsTarget[],
): Promise<boolean> => {
  if (targets.length === 0) {
    return true;
  }
  console.info();
  console.info(MESSAGES.AGENT_SKILLS_INSTALLATION_IN_PROGRESS);

  const installed = await new Promise<boolean>((resolve) => {
    // `npx` is a `.cmd` on Windows, which only a shell runs. No argument has
    // a space in it, so the shell has nothing to split.
    const child = spawn(
      'npx',
      ['--yes', SKILLS_PACKAGE, 'add', '--agent', targets.join(',')],
      {
        cwd: join(process.cwd(), dir),
        stdio: 'inherit',
        shell: process.platform === 'win32',
      },
    );
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });

  if (!installed) {
    printAgentSkillsNextSteps(
      targets,
      MESSAGES.AGENT_SKILLS_INSTALLATION_FAILED,
    );
  }
  return installed;
};

/** How to install the skills later, for when `nest new` didn't. */
export const printAgentSkillsNextSteps = (
  targets: AgentSkillsTarget[],
  reason: string,
) => {
  if (targets.length === 0) {
    return;
  }
  console.info();
  console.info(ansis.yellow(reason));
  console.info(ansis.bold(agentSkillsCommand(targets)));
  console.info();
};
