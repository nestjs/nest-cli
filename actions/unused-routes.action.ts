import { bold, cyan, green, red, yellow, gray } from 'ansis';
import * as fs from 'fs';
import * as path from 'path';
import Table from 'cli-table3';
import { UnusedRoutesCommandContext } from '../commands/context/index.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import { RouteExtractor } from '../lib/routes/route-extractor.js';
import { FrontendScanner } from '../lib/routes/frontend-scanner.js';
import { RouteMatcher, RouteAnalysisResult } from '../lib/routes/route-matcher.js';
import { GithubFetcher } from '../lib/routes/github-fetcher.js';
import { AbstractAction } from './abstract.action.js';

const RISK_THRESHOLDS: Record<string, number> = {
  medium: 20,
  high: 40,
  critical: 60,
};

export class UnusedRoutesAction extends AbstractAction {
  public async handle(context: UnusedRoutesCommandContext): Promise<void> {
    await runUnusedRoutes(context);
  }
}

const runUnusedRoutes = async (
  context: UnusedRoutesCommandContext,
): Promise<void> => {
  const { frontendUrl, token, branch, format, output, include, exclude, failOn, sourceRoot } = context;

  let resolvedSourceRoot = sourceRoot;
  if (!resolvedSourceRoot) {
    try {
      const configuration = await loadConfiguration();
      resolvedSourceRoot = configuration.sourceRoot ?? 'src';
    } catch {
      resolvedSourceRoot = 'src';
    }
  }

  process.stdout.write(cyan('\n  Scanning backend controllers...\n'));
  const extractor = new RouteExtractor();
  const controllerFiles = findControllerFiles(resolvedSourceRoot);

  if (controllerFiles.length === 0) {
    console.error(
      red(`\n  No controller files found under "${resolvedSourceRoot}".\n`) +
      gray('  Make sure you are running this command from your NestJS project root.\n'),
    );
    process.exit(1);
  }

  const fileSources = controllerFiles.map((filePath) => ({
    path: filePath,
    content: fs.readFileSync(filePath, 'utf-8'),
  }));

  let backendRoutes = extractor.extractRoutesFromFiles(fileSources);
  process.stdout.write(
    green(`  ✓ Found ${bold(String(backendRoutes.length))} backend routes across ${controllerFiles.length} controller files.\n`),
  );

  if (include?.length) {
    backendRoutes = backendRoutes.filter((r) =>
      include.some((prefix) => r.fullPath.startsWith(prefix)),
    );
    process.stdout.write(gray(`  ↳ After --include filter: ${backendRoutes.length} routes\n`));
  }
  if (exclude?.length) {
    backendRoutes = backendRoutes.filter(
      (r) => !exclude.some((prefix) => r.fullPath.startsWith(prefix)),
    );
    process.stdout.write(gray(`  ↳ After --exclude filter: ${backendRoutes.length} routes\n`));
  }

  process.stdout.write(cyan('\n  Fetching frontend repository...\n'));
  const fetcher = new GithubFetcher(token);
  const { owner, repo } = parseRepoUrl(frontendUrl);

  let repoFiles: Array<{ path: string; content: string }>;
  let resolvedBranch: string;

  try {
    const result = await fetcher.fetchRepository(owner, repo, branch);
    repoFiles = result.files;
    resolvedBranch = result.branch;
    process.stdout.write(
      green(`  ✓ Fetched ${bold(String(repoFiles.length))} source files from ${bold(`${owner}/${repo}`)} @ ${bold(resolvedBranch)}.\n`),
    );
  } catch (err: any) {
    console.error(red(`\n  Failed to fetch repository: ${err.message}\n`));
    if (err.message?.includes('404') || err.message?.includes('Not Found')) {
      console.error(
        gray('  If this is a private repository, provide a token with --token <ghp_xxx>.\n'),
      );
    }
    process.exit(1);
  }

  process.stdout.write(cyan('\n  Scanning frontend for API calls...\n'));
  const scanner = new FrontendScanner();
  const frontendCalls = scanner.scanFiles(repoFiles);
  process.stdout.write(
    green(`  ✓ Found ${bold(String(frontendCalls.length))} API calls in frontend source.\n`),
  );

  const matcher = new RouteMatcher(scanner);
  const result = matcher.match(backendRoutes, frontendCalls);

  const rendered = renderOutput(result, format, owner, repo, resolvedBranch);

  if (output) {
    fs.writeFileSync(output, rendered, 'utf-8');
    process.stdout.write(green(`\n  ✓ Report written to ${bold(output)}\n`));
  } else {
    process.stdout.write('\n' + rendered + '\n');
  }

  const unusedPercent = backendRoutes.length === 0
    ? 0
    : (result.unusedRoutes.length / backendRoutes.length) * 100;
  const threshold = RISK_THRESHOLDS[failOn] ?? RISK_THRESHOLDS.high;

  if (unusedPercent > threshold) {
    console.error(
      red(
        `\n  ✗ Unused route threshold exceeded (${Math.round(unusedPercent)}% unused, fail-on: ${failOn}).\n`,
      ),
    );
    process.exit(1);
  }
};

function findControllerFiles(sourceRoot: string): string[] {
  const results: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.controller.ts') || entry.name.endsWith('.controller.js'))
      ) {
        results.push(fullPath);
      }
    }
  };
  walk(sourceRoot);
  return results;
}

function parseRepoUrl(url: string): { owner: string; repo: string } {
  const cleaned = url
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
  const parts = cleaned.split('/');
  if (parts.length < 2) {
    throw new Error(
      `Invalid repository URL "${url}". Expected: https://github.com/owner/repo`,
    );
  }
  return { owner: parts[0], repo: parts[1] };
}

function renderOutput(
  result: RouteAnalysisResult,
  format: string,
  owner: string,
  repo: string,
  branch: string,
): string {
  if (format === 'json') return JSON.stringify(result, null, 2);
  if (format === 'markdown') return renderMarkdown(result, owner, repo, branch);
  return renderTable(result, owner, repo, branch);
}

function renderTable(result: RouteAnalysisResult, owner: string, repo: string, branch: string): string {
  const { unusedRoutes, usedRoutes, ambiguousRoutes, summary } = result;
  const lines: string[] = [];
  const riskColor = { low: green, medium: yellow, high: red, critical: red }[summary.riskScore] ?? red;

  lines.push('');
  lines.push(`  ${bold('Route Detective')}  ${gray(`${owner}/${repo} @ ${branch}`)}`);
  lines.push('');
  lines.push(`  ${bold('Total routes:')}   ${summary.totalBackendRoutes}`);
  lines.push(`  ${bold('Frontend calls:')} ${summary.totalFrontendCalls}`);
  lines.push(`  ${bold('Coverage:')}       ${summary.coveragePercent}%`);
  lines.push(`  ${bold('Risk score:')}     ${riskColor(summary.riskScore.toUpperCase())}`);
  lines.push('');

  if (unusedRoutes.length > 0) {
    lines.push(`  ${red(bold(`✗ Unused Routes (${unusedRoutes.length})`))}`);
    const table = new Table({
      head: [red('Method'), red('Path'), red('Controller'), red('Handler'), red('File')],
      style: { head: [], border: [] },
    });
    for (const r of unusedRoutes) {
      table.push([red(r.method), r.fullPath, r.controller, r.handler, gray(`${r.file}:${r.line}`)]);
    }
    lines.push(table.toString());
    lines.push('');
  }

  if (ambiguousRoutes.length > 0) {
    lines.push(`  ${yellow(bold(`⚠  Ambiguous Routes (${ambiguousRoutes.length})`))}`);
    const table = new Table({
      head: [yellow('Method'), yellow('Path'), yellow('Controller'), yellow('Handler')],
      style: { head: [], border: [] },
    });
    for (const r of ambiguousRoutes) {
      table.push([yellow(r.method), r.fullPath, r.controller, r.handler]);
    }
    lines.push(table.toString());
    lines.push('');
  }

  if (usedRoutes.length > 0) {
    lines.push(`  ${green(bold(`✓ Used Routes (${usedRoutes.length})`))}`);
    const table = new Table({
      head: [green('Method'), green('Path'), green('Controller'), green('Handler'), green('File')],
      style: { head: [], border: [] },
    });
    for (const r of usedRoutes) {
      table.push([green(r.method), r.fullPath, r.controller, r.handler, gray(`${r.file}:${r.line}`)]);
    }
    lines.push(table.toString());
    lines.push('');
  }
  return lines.join('\n');
}

function renderMarkdown(result: RouteAnalysisResult, owner: string, repo: string, branch: string): string {
  const { summary, unusedRoutes, usedRoutes, ambiguousRoutes } = result;
  return [
    `# Route Detective Report`,
    ``,
    `**Generated:** ${new Date().toISOString()}`,
    `**Repository:** \`${owner}/${repo}\` @ \`${branch}\``,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Backend Routes | ${summary.totalBackendRoutes} |`,
    `| Frontend API Calls Found | ${summary.totalFrontendCalls} |`,
    `| ✅ Used Routes | ${summary.usedCount} |`,
    `| ❌ Unused Routes | ${summary.unusedCount} |`,
    `| ⚠️ Ambiguous Routes | ${summary.ambiguousCount} |`,
    `| Coverage | ${summary.coveragePercent}% |`,
    `| Risk Score | **${summary.riskScore.toUpperCase()}** |`,
    ``,
    `## ❌ Unused Routes (${unusedRoutes.length})`,
    ``,
    ...unusedRoutes.map((r) => `- \`${r.method} ${r.fullPath}\` — \`${r.controller}::${r.handler}\` (${r.file}:${r.line})`),
    ``,
    `## ⚠️ Ambiguous Routes (${ambiguousRoutes.length})`,
    ``,
    ...ambiguousRoutes.map((r) => `- \`${r.method} ${r.fullPath}\` — \`${r.controller}::${r.handler}\``),
    ``,
    `## ✅ Used Routes (${usedRoutes.length})`,
    ``,
    ...usedRoutes.map((r) => `- \`${r.method} ${r.fullPath}\``),
  ].join('\n');
}
