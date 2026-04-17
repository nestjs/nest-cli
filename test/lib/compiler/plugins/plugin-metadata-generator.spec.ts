import * as ts from 'typescript';
import {
  appendJsExtensionIfMissing,
  requiresExplicitImportExtensions,
  rewriteAsyncImportString,
  rewriteCollectedMetadataForNodeNext,
  rewriteImportExpressionForNodeNext,
} from '../../../../lib/compiler/plugins/plugin-metadata-generator';

function createImportCall(specifier: string): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as unknown as ts.Expression,
    undefined,
    [ts.factory.createStringLiteral(specifier)],
  );
}

function printNode(node: ts.Node): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile(
    'tmp.ts',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

describe('PluginMetadataGenerator (#3364: nodenext import extensions)', () => {
  describe('requiresExplicitImportExtensions', () => {
    it('returns true for Node16 module resolution', () => {
      expect(
        requiresExplicitImportExtensions(
          { moduleResolution: ts.ModuleResolutionKind.Node16 },
          ts,
        ),
      ).toBe(true);
    });

    it('returns true for NodeNext module resolution', () => {
      expect(
        requiresExplicitImportExtensions(
          { moduleResolution: ts.ModuleResolutionKind.NodeNext },
          ts,
        ),
      ).toBe(true);
    });

    it('returns false for Node10 / classic module resolution', () => {
      expect(
        requiresExplicitImportExtensions(
          { moduleResolution: ts.ModuleResolutionKind.Node10 },
          ts,
        ),
      ).toBe(false);
      expect(
        requiresExplicitImportExtensions(
          { moduleResolution: ts.ModuleResolutionKind.Classic },
          ts,
        ),
      ).toBe(false);
    });

    it('returns false when moduleResolution is undefined', () => {
      expect(requiresExplicitImportExtensions({}, ts)).toBe(false);
    });

    it('returns false for the Bundler resolver (extensions not required)', () => {
      expect(
        requiresExplicitImportExtensions(
          { moduleResolution: ts.ModuleResolutionKind.Bundler },
          ts,
        ),
      ).toBe(false);
    });
  });

  describe('appendJsExtensionIfMissing', () => {
    it('appends `.js` to relative paths without an extension', () => {
      expect(appendJsExtensionIfMissing('./hello.dto')).toBe('./hello.dto.js');
      expect(appendJsExtensionIfMissing('../shared/user')).toBe(
        '../shared/user.js',
      );
    });

    it('leaves bare specifiers unchanged', () => {
      expect(appendJsExtensionIfMissing('@nestjs/common')).toBe(
        '@nestjs/common',
      );
      expect(appendJsExtensionIfMissing('rxjs')).toBe('rxjs');
    });

    it('does not double-append when an extension is already present', () => {
      expect(appendJsExtensionIfMissing('./hello.dto.js')).toBe(
        './hello.dto.js',
      );
      expect(appendJsExtensionIfMissing('./hello.dto.mjs')).toBe(
        './hello.dto.mjs',
      );
      expect(appendJsExtensionIfMissing('./hello.dto.cjs')).toBe(
        './hello.dto.cjs',
      );
      expect(appendJsExtensionIfMissing('./data.json')).toBe('./data.json');
    });

    it('leaves absolute paths unchanged', () => {
      expect(appendJsExtensionIfMissing('/usr/lib/foo')).toBe('/usr/lib/foo');
    });
  });

  describe('rewriteAsyncImportString', () => {
    it('rewrites a single dynamic import inside an `await import(...)` string', () => {
      expect(rewriteAsyncImportString('await import("./hello.dto")')).toBe(
        'await import("./hello.dto.js")',
      );
    });

    it('rewrites the dynamic import in a `(await import(...)).Foo` expression', () => {
      expect(
        rewriteAsyncImportString('(await import("./user.dto")).UserDto'),
      ).toBe('(await import("./user.dto.js")).UserDto');
    });

    it('leaves bare-specifier dynamic imports alone', () => {
      expect(
        rewriteAsyncImportString('await import("@nestjs/common")'),
      ).toBe('await import("@nestjs/common")');
    });

    it('does not re-append the extension on a previously-rewritten string', () => {
      const once = rewriteAsyncImportString('await import("./hello.dto")');
      const twice = rewriteAsyncImportString(once);
      expect(twice).toBe('await import("./hello.dto.js")');
    });

    it('handles single-quoted import specifiers', () => {
      expect(rewriteAsyncImportString("await import('./foo')")).toBe(
        "await import('./foo.js')",
      );
    });
  });

  describe('rewriteImportExpressionForNodeNext', () => {
    it('rewrites a top-level `import("./relative")` call expression', () => {
      const call = createImportCall('./hello.dto');
      const rewritten = rewriteImportExpressionForNodeNext(call, ts);
      expect(printNode(rewritten)).toBe('import("./hello.dto.js")');
    });

    it('leaves bare-specifier `import("rxjs")` calls unchanged', () => {
      const call = createImportCall('rxjs');
      const rewritten = rewriteImportExpressionForNodeNext(call, ts);
      expect(printNode(rewritten)).toBe('import("rxjs")');
    });

    it('does not modify a call that already includes a `.js` extension', () => {
      const call = createImportCall('./foo.js');
      const rewritten = rewriteImportExpressionForNodeNext(call, ts);
      expect(printNode(rewritten)).toBe('import("./foo.js")');
    });
  });

  describe('rewriteCollectedMetadataForNodeNext', () => {
    it('rewrites import call expressions across the entire metadata tree', () => {
      const fakeObjectLiteral = ts.factory.createObjectLiteralExpression([]);
      const metadata: Record<
        string,
        Record<
          string,
          Array<[ts.CallExpression, Record<string, never>]>
        >
      > = {
        '@nestjs/swagger': {
          models: [
            [createImportCall('./hello.dto'), {}],
            [createImportCall('../shared/user.dto'), {}],
            [createImportCall('@nestjs/common'), {}],
          ],
          controllers: [[createImportCall('./app.controller'), {}]],
        },
      };

      // Use the fake object literal somewhere so TS doesn't drop it; not used
      // by the rewriter but mirrors the real-world metadata shape.
      void fakeObjectLiteral;

      rewriteCollectedMetadataForNodeNext(metadata as any, ts);

      const printed = metadata['@nestjs/swagger'].models.map(([imp]) =>
        printNode(imp),
      );
      expect(printed).toEqual([
        'import("./hello.dto.js")',
        'import("../shared/user.dto.js")',
        'import("@nestjs/common")',
      ]);
      expect(
        printNode(metadata['@nestjs/swagger'].controllers[0][0]),
      ).toBe('import("./app.controller.js")');
    });
  });
});
