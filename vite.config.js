import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // React app
        content: resolve(__dirname, 'src/services/contentScript.js') // injection
      },
      output: {
        entryFileNames: ({ name }) =>
          name === 'content' ? 'contentScript.js' : '[name].js'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});
