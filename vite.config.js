import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Entrée principale React (popup)
        main: resolve(__dirname, 'index.html'),
        // Content script (sera généré dans dist/content/content.js)
        content: resolve(__dirname, 'src/content/content.js'),
        // Script injecté (sera généré dans dist/injected/imagesScraper.js)
        imagesScraper: resolve(__dirname, 'src/injected/imagesScraper.js')
      },
      output: {
        // On force les noms et dossiers de sortie pour chaque entrée
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'content/content.js';
          if (chunkInfo.name === 'imagesScraper') return 'injected/imagesScraper.js';
          if (chunkInfo.name === 'main') return 'assets/[name].js'; // Pour React
          return 'assets/[name].js';
        }
      }
    }
  },
  server: {
    hmr: {
      host: 'localhost'
    }
  }
});