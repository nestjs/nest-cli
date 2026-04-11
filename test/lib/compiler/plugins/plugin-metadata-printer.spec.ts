import * as fs from 'fs';
import * as ts from 'typescript';
import { PluginMetadataPrinter } from '../../../../lib/compiler/plugins/plugin-metadata-printer';

describe('PluginMetadataPrinter', () => {
  let printer: PluginMetadataPrinter;
  let writeFileSyncSpy: jest.SpyInstance;

  beforeEach(() => {
    printer = new PluginMetadataPrinter();
    writeFileSyncSpy = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    writeFileSyncSpy.mockRestore();
  });

  it('should include "// @ts-nocheck" directive in the generated metadata file', () => {
    const metadata = {};
    const typeImports = {};
    const options = { outputDir: '/tmp' };

    printer.print(metadata, typeImports, options, ts);

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
    const writtenContent = writeFileSyncSpy.mock.calls[0][1] as string;
    expect(writtenContent).toContain('// @ts-nocheck');
  });

  it('should include "/* eslint-disable */" directive in the generated metadata file', () => {
    const metadata = {};
    const typeImports = {};
    const options = { outputDir: '/tmp' };

    printer.print(metadata, typeImports, options, ts);

    const writtenContent = writeFileSyncSpy.mock.calls[0][1] as string;
    expect(writtenContent).toContain('/* eslint-disable */');
  });

  it('should have "// @ts-nocheck" after "/* eslint-disable */"', () => {
    const metadata = {};
    const typeImports = {};
    const options = { outputDir: '/tmp' };

    printer.print(metadata, typeImports, options, ts);

    const writtenContent = writeFileSyncSpy.mock.calls[0][1] as string;
    const eslintIndex = writtenContent.indexOf('/* eslint-disable */');
    const tsNocheckIndex = writtenContent.indexOf('// @ts-nocheck');
    expect(eslintIndex).toBeGreaterThanOrEqual(0);
    expect(tsNocheckIndex).toBeGreaterThan(eslintIndex);
  });

  it('should write to the correct filename when custom filename is provided', () => {
    const metadata = {};
    const typeImports = {};
    const options = { outputDir: '/tmp', filename: 'custom-metadata.ts' };

    printer.print(metadata, typeImports, options, ts);

    const writtenPath = writeFileSyncSpy.mock.calls[0][0] as string;
    expect(writtenPath).toContain('custom-metadata.ts');
  });
});
