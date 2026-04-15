// @ts-check
import { defineConfig, envField } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),

  env: {
    schema: {
      CITY_NAME: envField.string({ context: 'client', access: 'public', default: 'Saint Paul, MN' }),
      MAP_CENTER_LAT: envField.number({ context: 'client', access: 'public', default: 44.9537 }),
      MAP_CENTER_LNG: envField.number({ context: 'client', access: 'public', default: -93.0900 }),
      MAP_ZOOM: envField.number({ context: 'client', access: 'public', default: 13 }),
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});