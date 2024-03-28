import { defineConfig } from 'vite';

import { lingui } from '@lingui/vite-plugin';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr({
      svgrOptions: {},
    }),
    react({
      babel: {
        plugins: ['macros'],
      },
    }),
    lingui(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7481',
        changeOrigin: true,
      },
      '/img': {
        target: 'http://127.0.0.1:7481',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
