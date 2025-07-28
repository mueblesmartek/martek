// astro.config.mjs - CONFIGURACIÓN CON SSR
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: true // Usar nuestros estilos base personalizados
    }),
    react()
  ],
  
  // ✅ CAMBIO PRINCIPAL: De 'static' a 'server'
  output: 'server',
  
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