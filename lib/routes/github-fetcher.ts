import * as https from 'https';

export interface FetchedRepo {
  files: Array<{ path: string; content: string }>;
  branch: string;
  isPrivate: boolean;
}

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
const MAX_FILE_SIZE = 500_000;
const CONCURRENCY = 8;

export class GithubFetcher {
  private readonly token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  async fetchRepository(
    owner: string,
    repo: string,
    branch?: string,
  ): Promise<FetchedRepo> {
    const repoInfo = await this.get<any>(`/repos/${owner}/${repo}`);
    const isPrivate: boolean = repoInfo.private;
    const resolvedBranch = branch ?? repoInfo.default_branch;

    const treeData = await this.get<any>(
      `/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`,
    );

    const relevant = (treeData.tree as any[]).filter(
      (f) =>
        f.type === 'blob' &&
        f.size < MAX_FILE_SIZE &&
        SUPPORTED_EXTENSIONS.some((ext) => f.path.endsWith(ext)) &&
        !f.path.includes('node_modules') &&
        !f.path.includes('/dist/') &&
        !f.path.includes('/build/') &&
        !f.path.endsWith('.d.ts') &&
        !f.path.endsWith('.spec.ts') &&
        !f.path.endsWith('.test.ts') &&
        !f.path.endsWith('.spec.tsx') &&
        !f.path.endsWith('.test.tsx'),
    );

    const files: Array<{ path: string; content: string }> = [];
    for (let i = 0; i < relevant.length; i += CONCURRENCY) {
      const batch = relevant.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (f) => {
          const data = await this.get<any>(
            `/repos/${owner}/${repo}/contents/${f.path}?ref=${resolvedBranch}`,
          );
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          return { path: f.path, content };
        }),
      );
      for (const r of results) {
        if (r.status === 'fulfilled') files.push(r.value);
      }
    }

    return { files, branch: resolvedBranch, isPrivate };
  }

  private get<T>(urlPath: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'api.github.com',
        path: urlPath,
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NestJS-CLI-Route-Detective/1.0',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              resolve(JSON.parse(body) as T);
            } catch {
              reject(new Error(`Failed to parse GitHub response for ${urlPath}`));
            }
          } else if (res.statusCode === 404) {
            reject(new Error(`404 Not Found: ${urlPath}`));
          } else if (res.statusCode === 401) {
            reject(new Error(`401 Unauthorized — check your --token`));
          } else if (res.statusCode === 403) {
            reject(new Error(`403 Forbidden — rate limited or insufficient token scope`));
          } else {
            reject(new Error(`GitHub API error ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}
