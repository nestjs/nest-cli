import { join } from 'path';
import * as ts from 'typescript';
import { writeFileSync } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginMetadataPrinter } from '../../../../lib/compiler/plugins/plugin-metadata-printer.js';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, writeFileSync: vi.fn() };
});

const writeFileSyncMock = vi.mocked(writeFileSync);

describe('PluginMetadataPrinter', () => {
  let printer: PluginMetadataPrinter;

  beforeEach(() => {
    writeFileSyncMock.mockClear();
    printer = new PluginMetadataPrinter();
  });

  it('writes the default metadata.ts file with the eslint-disable header and async default export', () => {
    printer.print({}, {}, { outputDir: '/tmp' }, ts);

    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const [filePath, contents] = writeFileSyncMock.mock.calls[0] as [
      string,
      string,
    ];

    expect(filePath).toBe(join('/tmp', 'metadata.ts'));
    expect(contents.startsWith('/* eslint-disable */')).toBe(true);
    expect(contents).toContain('export default async () => {');
  });

  it('honours the custom filename option', () => {
    printer.print({}, {}, { outputDir: '/tmp', filename: 'custom.ts' }, ts);

    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const [filePath] = writeFileSyncMock.mock.calls[0] as [string, string];

    expect(filePath).toBe(join('/tmp', 'custom.ts'));
    expect(filePath.endsWith('custom.ts')).toBe(true);
  });

  it('emits the type imports into the `t` variable in the generated body', () => {
    printer.print(
      {},
      { MyType: 'require("./my").MyType' },
      { outputDir: '/tmp' },
      ts,
    );

    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const [, contents] = writeFileSyncMock.mock.calls[0] as [string, string];

    expect(contents).toContain('const t = {');
    expect(contents).toContain('"MyType"');
    expect(contents).toContain('require("./my").MyType');
  });

  it('propagates the metadata tree (top-level keys and nested file paths) into the output', () => {
    const importCall = ts.factory.createCallExpression(
      ts.factory.createToken(
        ts.SyntaxKind.ImportKeyword,
      ) as unknown as ts.Expression,
      undefined,
      [ts.factory.createStringLiteral('./controller')],
    );

    const metadata = {
      '@nestjs/common': {
        './controller.ts': [
          [importCall, { foo: ts.factory.createObjectLiteralExpression([]) }],
        ] as Array<[ts.CallExpression, any]>,
      },
    };

    printer.print(metadata as any, {}, { outputDir: '/tmp' }, ts);

    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const [, contents] = writeFileSyncMock.mock.calls[0] as [string, string];

    expect(contents).toContain('"@nestjs/common"');
    expect(contents).toContain('"./controller.ts"');
    expect(contents).toContain('"foo"');
  });
});
