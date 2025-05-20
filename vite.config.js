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
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: assetInfo => {
          if (assetInfo.name === 'content') return 'contentScript.js';
          return '[name].js';
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
