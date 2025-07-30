// astro.config.mjs - MODO ESTÁTICO PARA NETLIFY
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    tailwind({ applyBaseStyles: true }),
    react()
  ],
  
  output: 'static',  // ✅ Estático para Netlify
  // adapter: node(),  // ✅ Comentado
  
  site: 'https://mueblesmartek.com',
  vite: {
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    }
  }
});