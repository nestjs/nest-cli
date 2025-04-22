export function assertNonArray<T>(
  value: T,
): asserts value is Exclude<T, any[]> {
  if (Array.isArray(value)) {
    throw new TypeError('Expected a non-array value');
  }
}
