import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@game': resolve(__dirname, 'src/game'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
