import { bold, cyan, red, yellow } from 'ansis';
import { Command } from 'commander';
import { AbstractCommand } from './abstract.command.js';
import { UnusedRoutesCommandContext } from './context/index.js';

export class UnusedRoutesCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command('routes:unused')
      .alias('ru')
      .description(this.buildDescription())
      .requiredOption(
        '--frontend <url>',
        'GitHub repository URL of the frontend application to scan (public or private).',
      )
      .option(
        '--token [token]',
        'GitHub Personal Access Token for scanning private repositories.',
      )
      .option(
        '--branch [branch]',
        "Branch to scan in the frontend repository. Defaults to the repository's default branch.",
      )
      .option(
        '--format [format]',
        'Output format for results: table | json | markdown.',
        'table',
      )
      .option(
        '--output [path]',
        'Write the report to a file instead of stdout.',
      )
      .option(
        '--include [prefixes]',
        'Comma-separated list of route path prefixes to include (e.g. /api/v1,/api/v2).',
      )
      .option(
        '--exclude [prefixes]',
        'Comma-separated list of route path prefixes to exclude (e.g. /api/internal,/api/admin).',
      )
      .option(
        '--fail-on [level]',
        `Exit with code 1 when unused route risk reaches this level: ${cyan('medium')} | ${yellow('high')} | ${red('critical')}.`,
        'high',
      )
      .option(
        '--source-root [path]',
        'Path to the NestJS source root containing controller files. Defaults to nest-cli.json sourceRoot.',
      )
      .action(async (options: Record<string, any>) => {
        const context: UnusedRoutesCommandContext = {
          frontendUrl: options.frontend,
          token: options.token,
          branch: options.branch,
          format: options.format ?? 'table',
          output: options.output,
          include: options.include
            ? options.include.split(',').map((s: string) => s.trim()).filter(Boolean)
            : undefined,
          exclude: options.exclude
            ? options.exclude.split(',').map((s: string) => s.trim()).filter(Boolean)
            : undefined,
          failOn: options.failOn ?? 'high',
          sourceRoot: options.sourceRoot,
        };

        await this.action.handle(context);
      });
  }

  private buildDescription(): string {
    return (
      'Detect unused routes in your NestJS backend by scanning a frontend GitHub repository.\n' +
      `  Uses ${bold('ts-morph')} AST analysis to find all API calls in the frontend\n` +
      '  and cross-references them against your backend controller routes.\n\n' +
      '  Examples:\n' +
      `    ${cyan('nest routes:unused --frontend https://github.com/org/frontend')}\n` +
      `    ${cyan('nest routes:unused --frontend https://github.com/org/private-app --token ghp_xxxx')}\n` +
      `    ${cyan('nest routes:unused --frontend https://github.com/org/frontend --format markdown --output report.md')}\n` +
      `    ${cyan('nest ru --frontend https://github.com/org/frontend --exclude /api/internal --fail-on critical')}`
    );
  }
}
