// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/services/contentScript.js'),
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'public/background.js')
      },
      output: {
        entryFileNames: assetInfo => {
          if (assetInfo.name === 'content') return 'contentScript.js';
          return '[name].js';
        },
        // Génère un CSS sans hash pour charger un nom fixe index.css
        assetFileNames: assetInfo => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/index.css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
