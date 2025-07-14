// src/utils/constants.ts

export const SITE_CONFIG = {
  name: 'Kamasex.shop',
  description: 'Tienda premium de productos para adultos',
  url: 'http://localhost:4321',
  ogImage: '/images/og-image.jpg',
} as const;

export const NAVIGATION_ITEMS = [
  { name: 'Inicio', href: '/' },
  { name: 'Productos', href: '/productos' },
  { name: 'Categorías', href: '/categorias' },
  { name: 'Ofertas', href: '/ofertas' },
  { name: 'Contacto', href: '/contacto' },
] as const;

export const CATEGORIES = [
  { id: 'juguetes', name: 'Juguetes', slug: 'juguetes' },
  { id: 'lenceria', name: 'Lencería', slug: 'lenceria' },
  { id: 'lubricantes', name: 'Lubricantes', slug: 'lubricantes' },
  { id: 'wellness', name: 'Wellness', slug: 'wellness' },
] as const;