import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.{js,mjs}'],
    testTimeout: 30000,
    hookTimeout: 20000,
    // E2E tests must run sequentially (single app instance)
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
