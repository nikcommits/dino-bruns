import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://nikcommits.github.io',
  base: '/dino-bruns',
  integrations: [tailwind({
    applyBaseStyles: false,
  })],
});
