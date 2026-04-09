import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.{js,mjs}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/main/**/*.js'],
      exclude: ['src/main/main.js', 'src/main/windows.js', 'src/main/menu.js'],
    },
  },
  esbuild: {
    target: 'es2022',
  },
});
