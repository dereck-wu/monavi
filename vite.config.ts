import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const standalone = new Set(['background', 'content']);

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        panel: entry('./panel.html'),
        web: entry('./web.html'),
        background: entry('./src/background.ts'),
        content: entry('./src/content.ts'),
      },
      output: {
        entryFileNames: (chunk) => (standalone.has(chunk.name) ? '[name].js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
