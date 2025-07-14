import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://kamasex.shop',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    })
  ],
  output: 'static',
  
  // 🚫 IGNORAR ARCHIVOS TEMPORALMENTE PARA BUILD
  vite: {
    build: {
      rollupOptions: {
        external: [
          'nanostores',
          '@nanostores/persistent', 
          'airtable',
          'firebase',
          'firebase-admin'
        ]
      }
    },
    // Excluir archivos problemáticos del build
    optimizeDeps: {
      exclude: ['nanostores', 'airtable', 'firebase']
    }
  }
});