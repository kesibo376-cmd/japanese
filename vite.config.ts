import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: "/japanese",
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});