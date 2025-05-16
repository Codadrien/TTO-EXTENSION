// Configuration Vite pour extension Chrome avec React
// Tout le contenu de public/ (manifest, icons, background.js, index.html) sera copié dans dist/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    hmr: {
      host: 'localhost'
    }
  }
});
