import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: ['tests/db/**', 'e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
