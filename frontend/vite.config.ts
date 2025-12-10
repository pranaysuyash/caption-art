import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { 
    sourcemap: true,
  },
  esbuild: {
    // Exclude test files from build
    exclude: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.property.test.ts',
      '**/*.property.test.tsx',
      '**/*.integration.test.ts',
      '**/*.integration.test.tsx',
    ],
  },
});
