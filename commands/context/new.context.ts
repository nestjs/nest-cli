import type { AgentSkillsTarget } from '../../lib/utils/agent-skills.js';

export interface NewCommandContext {
  name?: string;
  directory?: string;
  dryRun: boolean;
  skipGit: boolean;
  skipInstall: boolean;
  skipTests: boolean;
  packageManager?: string;
  language: string;
  collection: string;
  strict: boolean;
  format: boolean;
  /**
   * Whether to auto-configure `@nestjs/observe`. Left `undefined` when the
   * user passed neither `--observe` nor `--no-observe`, so the action knows it
   * still has to ask.
   */
  observe?: boolean;
  minimal: boolean;
  /** Module system, `esm` or `cjs`; the schematic's default when undefined. */
  type?: string;
  /**
   * Which coding agents get the official NestJS agent skills, as the
   * `@nestjs/skills` installer names them; empty for none. Left `undefined`
   * when neither `--skills` nor `--skip-skills` was passed, so the action
   * knows it still has to ask.
   */
  skills?: AgentSkillsTarget[];
}
