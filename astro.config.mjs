// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static-first portfolio with no client-side game islands.
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
});
