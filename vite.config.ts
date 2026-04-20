/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_VECTOR_BACKEND_URL': JSON.stringify(env.VITE_VECTOR_BACKEND_URL || ''),
        'process.env.VITE_MEDIA_BACKEND_URL': JSON.stringify(env.VITE_MEDIA_BACKEND_URL || ''),
        'process.env.VITE_GRAPH_BACKEND_URL': JSON.stringify(env.VITE_GRAPH_BACKEND_URL || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      worker: {
        format: 'es'
      },
      test: {
        globals: true,
        include: ['src/**/*.test.ts', 'backend/**/*.test.js'],
      }
    };
});
