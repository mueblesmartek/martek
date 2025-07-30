// src/types/window.d.ts - DECLARACIONES DE TIPOS PARA FUNCIONES DEL CARRITO
// Este archivo le dice a TypeScript qué funciones están disponibles en window

declare global {
  interface Window {
    // ✅ Funciones del sistema de carrito original (cart.js)
    addToCart: (productId: string, productName: string, productPrice: number, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartCounter: () => void;
    clearCart: () => void;
    getCartItems: () => any[];
    getCartTotal: () => number;
    CartAPI?: any; // Tu sistema actual de carrito
    
    // ✅ Funciones del cart loader helper (versión original)
    waitForCart?: (timeout?: number) => Promise<boolean>;
    whenCartReady?: (callback: () => void, timeout?: number) => Promise<void>;
    safeAddToCart?: (productId: string, productName: string, productPrice: number, quantity?: number) => Promise<boolean>;
    safeUpdateCartCounter?: () => Promise<void>;
    
    // ✅ Funciones del helper integrado (para tu Layout actual)
    waitForCartAPI: (timeout?: number) => Promise<boolean>;
    
    // ✅ Función auxiliar para cambiar imágenes (si la usas)
    selectImage?: (url: string, alt: string, index: number) => void;
  }
}

export {};