// astro.config.mjs - CONFIGURACIÓN ESTÁTICA CORREGIDA
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: true
    }),
    react()
  ],
  
  output: 'static',
  
  site: 'https://kamasex.shop',
  base: '/',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets'
  },
  vite: {
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    }
  }
});