import * as path from 'path';
import * as ts from 'typescript';
import { tsconfigPathsBeforeHookFactory } from '../../../../lib/compiler/hooks/tsconfig-paths.hook';

function createSpec(baseUrl: string, fileNames: string[]) {
  const options: ts.CompilerOptions = {
    baseUrl,
    outDir: path.join(baseUrl, 'dist'),
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  };

  const program = ts.createProgram({
    rootNames: fileNames.map((name) => path.join(baseUrl, name)),
    options,
  });
  const output = new Map<string, string>();
  program.emit(
    undefined,
    (fileName, data) => {
      output.set(path.relative(baseUrl, fileName), data);
    },
    undefined,
    undefined,
    {
      before: [tsconfigPathsBeforeHookFactory(options)],
    },
  );
  return output;
}

describe('tsconfig paths hooks', () => {
  it('should remove type imports', async () => {
    const output = createSpec(path.join(__dirname, './fixtures/type-imports'), [
      'src/main.ts',
      'src/type-a.ts',
      'src/type-b.ts',
      'src/type-c.ts',
      'src/type-d.ts',
    ]);
    output.forEach((value) => {
      expect(value).toEqual(
        `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n`,
      );
    });
  });

  it('should remove unused imports', async () => {
    const output = createSpec(
      path.join(__dirname, './fixtures/unused-imports'),
      ['src/main.ts', 'src/foo.ts', 'src/bar.ts'],
    );
    expect(output).toMatchSnapshot();
  });
});
