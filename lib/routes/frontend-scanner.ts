import { Project, SyntaxKind, Node, CallExpression } from 'ts-morph';

export type FrontendCallType =
  | 'fetch'
  | 'axios'
  | 'superagent'
  | 'http-client'
  | 'query-hook'
  | 'unknown';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'unknown';

export interface FrontendApiCall {
  method: HttpMethod;
  url: string;
  normalizedUrl: string;
  file: string;
  line: number;
  callType: FrontendCallType;
}

const SUPERAGENT_METHODS: Record<string, HttpMethod> = {
  get: 'GET', post: 'POST', put: 'PUT',
  patch: 'PATCH', del: 'DELETE', delete: 'DELETE',
  head: 'HEAD', options: 'OPTIONS',
};

const EXCLUDED_STRINGS = new Set([
  'authorization', 'content-type', 'accept', 'token', 'bearer',
  'get', 'post', 'put', 'delete', 'patch', 'head', 'options',
]);

export class FrontendScanner {
  scanFiles(files: Array<{ path: string; content: string }>): FrontendApiCall[] {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { target: 99 },
    });

    for (const file of files) {
      try {
        project.createSourceFile(file.path, file.content, { overwrite: true });
      } catch {
      }
    }

    const calls: FrontendApiCall[] = [];
    for (const sourceFile of project.getSourceFiles()) {
      calls.push(...this.scanSourceFile(sourceFile));
    }
    return calls;
  }

  normalizeUrl(url: string): string {
    let normalized = url.startsWith('/') ? url : '/' + url;
    normalized = normalized.replace(/^https?:\/\/[^/]+/, '');
    normalized = normalized.replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, ':param');
    normalized = normalized.replace(/\{[^}]+\}/g, ':param');
    normalized = normalized.replace(/\[[^\]]+\]/g, ':param');
    normalized = normalized.split('?')[0];
    return normalized.replace(/\/+$/, '') || '/';
  }

  private scanSourceFile(sourceFile: any): FrontendApiCall[] {
    const calls: FrontendApiCall[] = [];

    sourceFile.forEachDescendant((node: any) => {
      if (node.getKind() !== SyntaxKind.CallExpression) return;
      const call = node as CallExpression;

      const result =
        this.tryAxios(call, sourceFile.getFilePath()) ??
        this.tryFetch(call, sourceFile.getFilePath()) ??
        this.trySuperagent(call, sourceFile.getFilePath()) ??
        this.tryRequestsWrapper(call, sourceFile.getFilePath()) ??
        this.tryAngularHttp(call, sourceFile.getFilePath()) ??
        this.tryQueryHook(call, sourceFile.getFilePath());

      if (result) calls.push(result);
    });

    return calls;
  }

  // ── axios & Vue.axios ─────────────────────────────────────────────────────

  private tryAxios(call: CallExpression, filePath: string): FrontendApiCall | null {
    const expr = call.getExpression().getText();

    const methodMatch = expr.match(/(?:[\w.]*axios)\.(get|post|put|patch|delete|head|options)$/i);
    if (methodMatch) {
      const url = this.firstStringArg(call, true);
      if (!url) return null;
      return this.build('axios', methodMatch[1].toUpperCase() as HttpMethod, url, call, filePath);
    }

    if (expr === 'axios' || expr.endsWith('.axios')) {
      const url = this.objectProp(call, 'url');
      const method = this.objectProp(call, 'method') ?? 'GET';
      if (!url) return null;
      return this.build('axios', method.toUpperCase() as HttpMethod, url, call, filePath);
    }

    return null;
  }

  // ── fetch ─────────────────────────────────────────────────────────────────

  private tryFetch(call: CallExpression, filePath: string): FrontendApiCall | null {
    const expr = call.getExpression().getText();
    if (expr !== 'fetch' && !expr.endsWith('.fetch')) return null;

    const url = this.firstStringArg(call, false);
    if (!url) return null;

    let method: HttpMethod = 'GET';
    const args = call.getArguments();
    if (args.length >= 2) {
      const m = this.objectPropFromNode(args[1], 'method');
      if (m) method = m.toUpperCase() as HttpMethod;
    }

    return this.build('fetch', method, url, call, filePath);
  }

  // ── superagent direct ─────────────────────────────────────────────────────

  private trySuperagent(call: CallExpression, filePath: string): FrontendApiCall | null {
    const expr = call.getExpression().getText();
    const match = expr.match(
      /(?:superagent|_superagent|request|agent)\.(get|post|put|patch|del|delete|head|options)$/i,
    );
    if (!match) return null;

    const url = this.firstStringArg(call, false);
    if (!url) return null;
    const method = SUPERAGENT_METHODS[match[1].toLowerCase()] ?? 'GET';
    return this.build('superagent', method, url, call, filePath);
  }

  // ── Generic HTTP wrapper object ───────────────────────────────────────────

  private tryRequestsWrapper(call: CallExpression, filePath: string): FrontendApiCall | null {
    const expr = call.getExpression().getText();

    const match = expr.match(
      /(\w+)\.(get|post|put|patch|del|delete|update|query|destroy)$/,
    );
    if (!match) return null;

    const objectName = match[1].toLowerCase();
    const methodName = match[2].toLowerCase();

    const isApiObject =
      /service|api|client|http|request|resource|agent/.test(objectName) ||
      objectName === 'requests';

    if (!isApiObject) return null;

    const args = call.getArguments();
    if (!args.length) return null;

    const methodMap: Record<string, HttpMethod> = {
      get: 'GET', query: 'GET',
      post: 'POST',
      put: 'PUT', update: 'PUT',
      patch: 'PATCH',
      del: 'DELETE', delete: 'DELETE', destroy: 'DELETE',
    };
    const method = methodMap[methodName] ?? 'GET';

    const url = this.firstStringArgOrBinaryPrefix(args[0], true);
    if (!url) return null;

    return this.build('axios', method, url, call, filePath);
  }

  // ── Angular HttpClient ────────────────────────────────────────────────────

  private tryAngularHttp(call: CallExpression, filePath: string): FrontendApiCall | null {
    const expr = call.getExpression().getText();
    const match = expr.match(
      /(?:this\.)?_?http\.(get|post|put|patch|delete|head|options)$/i,
    );
    if (!match) return null;

    const url = this.firstStringArg(call, false);
    if (!url) return null;

    return this.build('http-client', match[1].toUpperCase() as HttpMethod, url, call, filePath);
  }

  // ── React Query / SWR ────────────────────────────────────────────────────

  private tryQueryHook(call: CallExpression, filePath: string): FrontendApiCall | null {
    const expr = call.getExpression().getText();
    if (!/use(Query|SWR|InfiniteQuery|Mutation)/i.test(expr)) return null;

    const url = this.firstStringArg(call, false);
    if (!url || !url.startsWith('/')) return null;

    const method: HttpMethod = /mutation/i.test(expr) ? 'POST' : 'GET';
    return this.build('query-hook', method, url, call, filePath);
  }

  // ── Argument helpers ──────────────────────────────────────────────────────

  private firstStringArg(call: CallExpression, allowShort: boolean): string | null {
    const args = call.getArguments();
    if (!args.length) return null;
    return this.firstStringArgOrBinaryPrefix(args[0], allowShort);
  }

  private firstStringArgOrBinaryPrefix(node: Node, allowShort: boolean): string | null {
    if (node.getKind() === SyntaxKind.StringLiteral) {
      const val = (node as any).getLiteralValue() as string;
      return this.isLikelyUrl(val, allowShort) ? val : null;
    }

    if (
      node.getKind() === SyntaxKind.TemplateExpression ||
      node.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
    ) {
      const text = node
        .getText()
        .replace(/`/g, '')
        .replace(/\$\{[^}]+\}/g, ':param');
      return this.isLikelyUrl(text, allowShort) ? text : null;
    }

    if (node.getKind() === SyntaxKind.BinaryExpression) {
      const prefix = this.extractBinaryLeftString(node as any);
      if (prefix && this.isLikelyUrl(prefix, allowShort)) {
        return prefix.endsWith('/') ? prefix + ':param' : prefix + '/:param';
      }
    }

    return null;
  }

  /**
   * Determines if a string value is likely an API URL path.
   */
  private isLikelyUrl(val: string, allowShort: boolean): boolean {
    if (!val || val.length === 0) return false;
    if (EXCLUDED_STRINGS.has(val.toLowerCase())) return false;
    if (val.startsWith('http')) return true;
    if (val.startsWith('/')) return true;
    if (val.includes('/')) return true;
    if (allowShort && /^[a-z][a-z0-9_-]*$/.test(val) && val.length > 2) return true;
    return false;
  }

  private extractBinaryLeftString(node: any): string | null {
    const left = node.getLeft();
    if (left.getKind() === SyntaxKind.StringLiteral) {
      return left.getLiteralValue();
    }
    if (left.getKind() === SyntaxKind.BinaryExpression) {
      return this.extractBinaryLeftString(left);
    }
    return null;
  }

  private objectProp(call: CallExpression, key: string): string | null {
    const args = call.getArguments();
    return args.length ? this.objectPropFromNode(args[0], key) : null;
  }

  private objectPropFromNode(node: Node, key: string): string | null {
    if (node.getKind() !== SyntaxKind.ObjectLiteralExpression) return null;
    for (const prop of (node as any).getProperties()) {
      try {
        if (prop.getName?.() === key) {
          const init = prop.getInitializer?.();
          if (!init) return null;
          if (init.getKind() === SyntaxKind.StringLiteral) return init.getLiteralValue();
          return init.getText().replace(/['"]/g, '');
        }
      } catch {}
    }
    return null;
  }

  private build(
    callType: FrontendCallType,
    method: HttpMethod,
    url: string,
    call: CallExpression,
    filePath: string,
  ): FrontendApiCall {
    const pos = call.getSourceFile().getLineAndColumnAtPos(call.getStart());
    return {
      callType,
      method,
      url,
      normalizedUrl: this.normalizeUrl(url),
      file: filePath,
      line: pos.line,
    };
  }
}
