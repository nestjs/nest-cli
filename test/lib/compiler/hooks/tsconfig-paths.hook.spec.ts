import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as ts from 'typescript';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { JsxEmit } from 'typescript';
import { tsconfigPathsBeforeHookFactory } from '../../../../lib/compiler/hooks/tsconfig-paths.hook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createSpec(
  baseUrl: string,
  fileNames: string[],
  compilerOptions?: ts.CompilerOptions,
) {
  const options: ts.CompilerOptions = {
    baseUrl,
    outDir: path.join(baseUrl, 'dist'),
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    ...compilerOptions,
  };

  const program = ts.createProgram({
    rootNames: fileNames.map((name) => path.join(baseUrl, name)),
    options,
  });
  const output = new Map<string, string>();
  const transformer = tsconfigPathsBeforeHookFactory(options);
  program.emit(
    undefined,
    (fileName, data) => {
      output.set(path.relative(baseUrl, fileName), data);
    },
    undefined,
    undefined,
    {
      before: transformer ? [transformer] : [],
    },
  );
  return output;
}

describe('tsconfig paths hooks', () => {
  describe('CJS output (module: CommonJS)', () => {
    it('should remove type imports', () => {
      const output = createSpec(
        path.join(__dirname, './fixtures/type-imports'),
        [
          'src/main.ts',
          'src/type-a.ts',
          'src/type-b.ts',
          'src/type-c.ts',
          'src/type-d.ts',
        ],
      );
      output.forEach((value) => {
        expect(value).toEqual(
          `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n`,
        );
      });
    });

    it('should remove unused imports', () => {
      const output = createSpec(
        path.join(__dirname, './fixtures/unused-imports'),
        ['src/main.ts', 'src/foo.ts', 'src/bar.ts'],
      );
      const mainJs = output.get('dist/main.js')!;
      expect(mainJs).not.toContain('require');
    });

    it('should replace aliased imports with relative paths', () => {
      const output = createSpec(
        path.join(__dirname, './fixtures/aliased-imports'),
        ['src/main.ts', 'src/foo.ts', 'src/bar.ts'],
        {
          paths: { '~/*': ['./src/*'] },
          jsx: JsxEmit.Preserve,
          allowJs: true,
        },
      );
      const mainJs = output.get('dist/main.js')!;
      expect(mainJs).toContain('require("./foo")');
      expect(mainJs).toContain('require("./bar")');
      expect(mainJs).toContain('require("./baz")');
      expect(mainJs).toContain('require("./qux")');
      expect(mainJs).not.toContain('~/');
    });
  });

  describe('ESM output (module: ESNext)', () => {
    const esmOptions: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
    };

    it('should remove type imports', () => {
      const output = createSpec(
        path.join(__dirname, './fixtures/type-imports'),
        [
          'src/main.ts',
          'src/type-a.ts',
          'src/type-b.ts',
          'src/type-c.ts',
          'src/type-d.ts',
        ],
        esmOptions,
      );
      output.forEach((value) => {
        expect(value).toEqual('export {};\n');
      });
    });

    it('should remove unused imports', () => {
      const output = createSpec(
        path.join(__dirname, './fixtures/unused-imports'),
        ['src/main.ts', 'src/foo.ts', 'src/bar.ts'],
        esmOptions,
      );
      const mainJs = output.get('dist/main.js')!;
      expect(mainJs).not.toContain('import');
    });

    it('should replace aliased imports with relative paths', () => {
      const output = createSpec(
        path.join(__dirname, './fixtures/aliased-imports'),
        ['src/main.ts', 'src/foo.ts', 'src/bar.ts'],
        {
          ...esmOptions,
          paths: { '~/*': ['./src/*'] },
          jsx: JsxEmit.Preserve,
          allowJs: true,
        },
      );
      const mainJs = output.get('dist/main.js')!;
      expect(mainJs).toContain('from "./foo"');
      expect(mainJs).toContain('from "./bar"');
      expect(mainJs).toContain('from "./baz"');
      expect(mainJs).toContain('from "./qux"');
      expect(mainJs).not.toContain('~/');
    });
  });
});
