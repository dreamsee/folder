import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'gl-matrix': ['gl-matrix'],
          'ui': ['hammerjs']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['gl-matrix', 'hammerjs']
  }
});