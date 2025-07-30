// src/lib/CartTypes.ts - ARCHIVO MAESTRO ÚNICO DE TIPOS

// ✅ INTERFACE PRINCIPAL DEL ITEM DE CARRITO
export interface CartItem {
  id: string;
  product_id: string;
  user_id?: string | null;
  quantity: number;
  product_name: string;
  product_price: number;
  product_image?: string | null;
  product_category?: string;
  created_at: string;
  updated_at: string;
}

// ✅ INTERFACE PARA TOTALES CALCULADOS
export interface CartTotals {
  items: number;        // Cantidad total de items
  subtotal: number;     // Subtotal sin impuestos ni envío
  shipping: number;     // Costo de envío
  tax: number;          // IVA (19%)
  total: number;        // Total final
}

// ✅ INTERFACE PARA EVENTOS DE CARRITO
export interface CartEventDetail {
  items?: CartItem[];
  totals?: CartTotals;
  item?: CartItem;
  itemId?: string;
  message?: string;
}

// ✅ INTERFACE PARA UTILIDADES DE PRECIO
export interface PriceUtilsInterface {
  validate(price: number | string | any): number;
  format(price: number): string;
  calculateItemTotal(price: number, quantity: number): number;
  calculateCartTotals(items: CartItem[]): CartTotals;
}

// ✅ INTERFACE PRINCIPAL DEL GESTOR DE CARRITO
export interface CartManagerInterface {
  // Operaciones CRUD básicas
  getItems(): CartItem[];
  addItem(productId: string, productName: string, productPrice: number, quantity?: number, productImage?: string, productCategory?: string): boolean;
  updateItemQuantity(itemId: string, quantity: number): boolean;
  removeItem(itemId: string): boolean;
  clearCart(): void;
  
  // Cálculos y consultas
  getTotals(): CartTotals;
  isEmpty(): boolean;
  
  // Para checkout y API
  getCheckoutSummary(): {
    items: CartItem[];
    totals: CartTotals;
    itemCount: number;
    isEmpty: boolean;
  };
}

// ✅ CONSTANTES UNIFICADAS (UNA SOLA FUENTE DE VERDAD)
export const CART_CONFIG = {
  STORAGE_KEY: 'martek-cart',
  FREE_SHIPPING_THRESHOLD: 100000,
  TAX_RATE: 0.19,
  SHIPPING_COST: 15000,
  
  EVENTS: {
    UPDATED: 'cart-updated',
    ITEM_ADDED: 'cart-item-added',
    ITEM_REMOVED: 'cart-item-removed',
    CLEARED: 'cart-cleared'
  },
  
  NOTIFICATION_DURATION: 3000
} as const;

// ✅ INTERFACE PARA PRODUCTO SIMPLE (para agregar al carrito)
export interface ProductForCart {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

// ✅ INTERFACE PARA NOTIFICACIONES
export interface CartNotificationOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// ✅ DECLARACIÓN GLOBAL ÚNICA (REEMPLAZA TODAS LAS OTRAS)
declare global {
  interface Window {
    // Objeto principal del carrito
    CartManager: CartManagerInterface;
    PriceUtils: PriceUtilsInterface;
    
    // Función principal simplificada
    addToCart: (productId: string, productName: string, productPrice: number, quantity?: number) => boolean;
    
    // Funciones auxiliares
    updateItemQuantity: (itemId: string, quantity: number) => boolean;
    removeItem: (itemId: string) => boolean;
    clearCart: () => void;
    
    // Funciones de consulta
    getCartTotals: () => CartTotals;
    getCartItems: () => CartItem[];
  }
  
  // Eventos personalizados del carrito
  interface WindowEventMap {
    'cart-updated': CustomEvent<CartEventDetail>;
    'cart-item-added': CustomEvent<CartEventDetail>;
    'cart-item-removed': CustomEvent<CartEventDetail>;
    'cart-cleared': CustomEvent<CartEventDetail>;
  }
}

// ✅ FUNCIONES HELPER DE VALIDACIÓN
export function isValidCartItem(item: any): item is CartItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.product_id === 'string' &&
    typeof item.product_name === 'string' &&
    typeof item.product_price === 'number' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  );
}

export function isValidCartTotals(totals: any): totals is CartTotals {
  return (
    totals &&
    typeof totals === 'object' &&
    typeof totals.items === 'number' &&
    typeof totals.subtotal === 'number' &&
    typeof totals.shipping === 'number' &&
    typeof totals.tax === 'number' &&
    typeof totals.total === 'number'
  );
}