import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths, so the built game works from any folder (e.g. GitHub Pages)
  build: { chunkSizeWarningLimit: 2000 }, // Phaser is big; that's fine
});
