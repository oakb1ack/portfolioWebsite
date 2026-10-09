import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { blogPlugin } from './scripts/blog-plugin.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), blogPlugin()],
});
