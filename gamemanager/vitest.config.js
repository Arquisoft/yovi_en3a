import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['**/*.js'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        'coverage/**',
        '*.config.js'
      ]
    },
    globals: true,
    environment: 'node'
  }
});