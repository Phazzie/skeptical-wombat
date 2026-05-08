import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/domain/**/*.ts', 'src/infrastructure/**/*.ts'],
      exclude: [
        'src/infrastructure/di/**',          // bootstrap wiring — not unit-tested here
        'src/infrastructure/adapters/Neon*', // requires live DB connection
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
