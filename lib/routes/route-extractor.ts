import { Project, SyntaxKind } from 'ts-morph';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface BackendRoute {
  method: HttpMethod;
  path: string;
  fullPath: string;
  controller: string;
  handler: string;
  file: string;
  line: number;
}

const HTTP_DECORATORS = new Set<string>([
  'Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options',
]);

const DECORATOR_TO_METHOD: Record<string, HttpMethod> = {
  Get: 'GET', Post: 'POST', Put: 'PUT',
  Patch: 'PATCH', Delete: 'DELETE', Head: 'HEAD', Options: 'OPTIONS',
};

export class RouteExtractor {
  extractRoutesFromFiles(
    files: Array<{ path: string; content: string }>,
  ): BackendRoute[] {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 99,
      },
    });

    for (const file of files) {
      try {
        project.createSourceFile(file.path, file.content, { overwrite: true });
      } catch {}
    }

    const routes: BackendRoute[] = [];
    for (const sourceFile of project.getSourceFiles()) {
      routes.push(...this.extractFromSourceFile(sourceFile));
    }
    return routes;
  }

  private extractFromSourceFile(sourceFile: any): BackendRoute[] {
    const routes: BackendRoute[] = [];

    for (const cls of sourceFile.getClasses()) {
      const controllerDecorator = cls
        .getDecorators()
        .find((d: any) => d.getName() === 'Controller');

      if (!controllerDecorator) continue;

      const prefix = this.extractDecoratorPath(controllerDecorator) ?? '';
      const controllerName = cls.getName() ?? 'UnknownController';

      for (const method of cls.getMethods()) {
        const httpDecorator = method
          .getDecorators()
          .find((d: any) => HTTP_DECORATORS.has(d.getName()));

        if (!httpDecorator) continue;

        const httpMethod = DECORATOR_TO_METHOD[httpDecorator.getName()];
        const methodPath = this.extractDecoratorPath(httpDecorator) ?? '';
        const fullPath = this.joinPaths(prefix, methodPath);

        routes.push({
          method: httpMethod,
          path: methodPath,
          fullPath,
          controller: controllerName,
          handler: method.getName(),
          file: sourceFile.getFilePath(),
          line: method.getStartLineNumber(),
        });
      }
    }

    return routes;
  }

  private extractDecoratorPath(decorator: any): string | undefined {
    try {
      const callExpr = decorator.getCallExpression();
      if (!callExpr) return undefined;
      const args = callExpr.getArguments();
      if (args.length === 0) return undefined;
      const first = args[0];
      if (first.getKind() === SyntaxKind.StringLiteral) {
        return first.getLiteralValue();
      }
      return first.getText().replace(/['"]/g, '');
    } catch {
      return undefined;
    }
  }

  private joinPaths(prefix: string, segment: string): string {
    const combined = `/${prefix}/${segment}`
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
    return combined || '/';
  }
}
