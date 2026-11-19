import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  getComputedOptions,
  getComputedOptionValue,
} from '../../../../lib/compiler/helpers/get-computed-options.js';

describe('getComputedOptions', () => {
  const { moduleResolution } = getComputedOptions(ts);

  it('keeps an option that is set explicitly', () => {
    expect(
      moduleResolution?.computeValue({
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
      }),
    ).toBe(ts.ModuleResolutionKind.Bundler);
  });

  it('computes an omitted option the way the compiler does', () => {
    expect(
      moduleResolution?.computeValue({ module: ts.ModuleKind.NodeNext }),
    ).toBe(ts.ModuleResolutionKind.NodeNext);
    expect(
      moduleResolution?.computeValue({ module: ts.ModuleKind.Node20 }),
    ).toBe(ts.ModuleResolutionKind.Node16);
  });

  it('has no entry for an option without a computed rule', () => {
    expect(getComputedOptions(ts).outDir).toBeUndefined();
  });
});

describe('getComputedOptionValue', () => {
  it('computes an omitted option the way the compiler does', () => {
    expect(
      getComputedOptionValue(
        { module: ts.ModuleKind.NodeNext },
        'moduleResolution',
        ts,
      ),
    ).toBe(ts.ModuleResolutionKind.NodeNext);
    expect(
      getComputedOptionValue({ strict: true }, 'strictNullChecks', ts),
    ).toBe(true);
    expect(
      getComputedOptionValue({ strict: false }, 'strictNullChecks', ts),
    ).toBe(false);
  });

  it('returns the option as written when it has no computed rule', () => {
    expect(getComputedOptionValue({ outDir: 'dist' }, 'outDir', ts)).toBe(
      'dist',
    );
  });
});
