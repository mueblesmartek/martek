// src/utils/helpers.ts
export function formatPrice(price: number): string {
  return price.toLocaleString('es-CO');
}

export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}