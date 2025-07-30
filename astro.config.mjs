// astro.config.mjs - CONFIGURACIÓN COMPATIBLE
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [
    tailwind({ applyBaseStyles: true }),
    react()
  ],
  
  output: 'hybrid',  // ✅ CAMBIO CRÍTICO
  adapter: node({
    mode: 'standalone'
  }),
  
  site: 'https://mueblesmartek.com',
  vite: {
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    }
  }
});