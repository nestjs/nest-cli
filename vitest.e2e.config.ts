import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/e2e/**/*.e2e-spec.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    teardownTimeout: 30_000,
    root: '.',
  },
});
