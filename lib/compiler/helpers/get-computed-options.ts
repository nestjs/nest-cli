import * as ts from 'typescript';

type ComputedOptions = {
  [K in keyof ts.CompilerOptions]: {
    computeValue(options: ts.CompilerOptions): ts.CompilerOptions[K];
  };
};

/**
 * Returns `ts.computedOptions`, the rules the compiler uses to compute the
 * value of an option omitted from tsconfig (e.g. `moduleResolution` follows
 * `module`). `getParsedCommandLineOfConfigFile()` leaves such options
 * `undefined`, and `computedOptions` is not part of the public typings, so it
 * is read here to stay in sync with every TypeScript version instead of
 * re-implementing its defaults.
 */
export function getComputedOptions(tsBinary: typeof ts): ComputedOptions {
  return (tsBinary as typeof ts & { computedOptions: ComputedOptions })
    .computedOptions;
}

/**
 * Returns the value the compiler uses for an option: the computed value when
 * TypeScript has a rule for it in `computedOptions`, the option as written
 * otherwise.
 */
export function getComputedOptionValue<K extends keyof ts.CompilerOptions>(
  options: ts.CompilerOptions,
  name: K,
  tsBinary: typeof ts,
): ts.CompilerOptions[K] {
  const computed = getComputedOptions(tsBinary)[name];

  if (!computed) {
    return options[name];
  }

  return computed.computeValue(options);
}
