import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages: /<repo-name>/competition/
export default defineConfig({
  plugins: [react()],
  base: '/chess-competition/competition/',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
