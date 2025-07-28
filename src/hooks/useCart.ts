// src/hooks/useCart.ts - HOOK SIMPLIFICADO SIN CONTEXT API
import { useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../lib/types';

// 🔗 DECLARACIÓN GLOBAL PARA TYPESCRIPT
declare global {
  interface Window {
    CartAPI: {
      getItems(): CartItem[];
      addProduct(data: {
        product_id: string;
        product_name: string;
        product_price: number;
        quantity?: number;
        product_image?: string;
        product_category?: string;
      }): void;
      updateQuantity(id: string, quantity: number): void;
      removeItem(id: string): void;
      clear(): void;
      getTotalItems(): number;
      getTotalPrice(): number;
      formatPrice(price: number): string;
      on(event: string, callback: (e: CustomEvent) => void): void;
      off(event: string, callback: (e: CustomEvent) => void): void;
      emit(event: string, data?: any): void;
      showNotification(message: string, type?: 'success' | 'error' | 'info'): void;
    };
  }
}

// 🎯 INTERFACE PARA EL ESTADO DEL CARRITO
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  isHydrated: boolean;
}

// 🎯 INTERFACE PARA EL HOOK
interface UseCartReturn {
  // Estado
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  isHydrated: boolean;
  
  // Acciones
  addProduct: (data: {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity?: number;
    product_image?: string;
    product_category?: string;
  }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  
  // Utilidades
  formatPrice: (price: number) => string;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  
  // Información del item específico
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

/**
 * 🛒 Hook useCart - Versión simplificada sin Context API
 * 
 * Se conecta directamente con window.CartAPI para:
 * - Evitar problemas entre React islands en Astro
 * - Mantener sincronización con localStorage
 * - Usar eventos para comunicación entre components
 */
export function useCart(): UseCartReturn {
  
  // 📦 ESTADO LOCAL DEL HOOK
  const [state, setState] = useState<CartState>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    isLoading: true,
    isHydrated: false
  });

  // 🔄 FUNCIÓN PARA SINCRONIZAR ESTADO CON CARTAPI
  const syncWithCartAPI = useCallback(() => {
    if (typeof window === 'undefined' || !window.CartAPI) {
      return;
    }

    try {
      const items = window.CartAPI.getItems();
      const totalItems = window.CartAPI.getTotalItems();
      const totalPrice = window.CartAPI.getTotalPrice();

      setState(prev => ({
        ...prev,
        items,
        totalItems,
        totalPrice,
        isLoading: false,
        isHydrated: true
      }));

    } catch (error) {
      console.error('❌ Error sincronizando con CartAPI:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isHydrated: true
      }));
    }
  }, []);

  // 🎬 INICIALIZACIÓN Y EVENTOS
  useEffect(() => {
    // Esperar a que CartAPI esté disponible
    let timeoutId: NodeJS.Timeout;
    
    const waitForCartAPI = () => {
      if (typeof window !== 'undefined' && window.CartAPI) {
        // CartAPI disponible, sincronizar estado inicial
        syncWithCartAPI();
        
        // Configurar listeners de eventos
        const handleCartUpdate = () => syncWithCartAPI();
        
        window.CartAPI.on('cart:updated', handleCartUpdate);
        window.CartAPI.on('cart:added', handleCartUpdate);
        window.CartAPI.on('cart:removed', handleCartUpdate);
        window.CartAPI.on('cart:cleared', handleCartUpdate);
        
        return () => {
          // Cleanup listeners
          if (window.CartAPI) {
            window.CartAPI.off('cart:updated', handleCartUpdate);
            window.CartAPI.off('cart:added', handleCartUpdate);
            window.CartAPI.off('cart:removed', handleCartUpdate);
            window.CartAPI.off('cart:cleared', handleCartUpdate);
          }
        };
      } else {
        // CartAPI no disponible aún, reintentar
        timeoutId = setTimeout(waitForCartAPI, 100);
      }
    };

    const cleanup = waitForCartAPI();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [syncWithCartAPI]);

  // 🛠️ FUNCIONES DE ACCIÓN (Wrappers para CartAPI)
  const addProduct = useCallback((data: {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity?: number;
    product_image?: string;
    product_category?: string;
  }) => {
    if (window.CartAPI) {
      window.CartAPI.addProduct(data);
    } else {
      console.warn('⚠️ CartAPI no disponible');
    }
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (window.CartAPI) {
      window.CartAPI.updateQuantity(id, quantity);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    if (window.CartAPI) {
      window.CartAPI.removeItem(id);
    }
  }, []);

  const clear = useCallback(() => {
    if (window.CartAPI) {
      window.CartAPI.clear();
    }
  }, []);

  const formatPrice = useCallback((price: number) => {
    if (window.CartAPI) {
      return window.CartAPI.formatPrice(price);
    }
    return `$${price || 0}`;
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (window.CartAPI) {
      window.CartAPI.showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }, []);

  // 🔍 FUNCIONES DE CONSULTA
  const getItemQuantity = useCallback((productId: string): number => {
    return state.items.find(item => item.product_id === productId)?.quantity || 0;
  }, [state.items]);

  const isInCart = useCallback((productId: string): boolean => {
    return state.items.some(item => item.product_id === productId);
  }, [state.items]);

  // 📤 RETORNAR API COMPLETA
  return {
    // Estado
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    isLoading: state.isLoading,
    isHydrated: state.isHydrated,
    
    // Acciones
    addProduct,
    updateQuantity,
    removeItem,
    clear,
    
    // Utilidades
    formatPrice,
    showNotification,
    
    // Consultas
    getItemQuantity,
    isInCart
  };
}

/**
 * 🎯 Hook adicional para componentes que solo necesitan info básica
 */
export function useCartInfo() {
  const { totalItems, totalPrice, formatPrice, isLoading } = useCart();
  
  return {
    totalItems,
    totalPrice,
    formattedTotal: formatPrice(totalPrice),
    isLoading,
    isEmpty: totalItems === 0
  };
}

/**
 * 📦 Hook para manejar un producto específico
 */
export function useCartItem(productId: string) {
  const { items, addProduct, updateQuantity, removeItem, getItemQuantity, isInCart } = useCart();
  
  const item = items.find(item => item.product_id === productId);
  const quantity = getItemQuantity(productId);
  const inCart = isInCart(productId);
  
  const addToCart = useCallback((productData: {
    product_name: string;
    product_price: number;
    quantity?: number;
    product_image?: string;
    product_category?: string;
  }) => {
    addProduct({
      product_id: productId,
      ...productData
    });
  }, [productId, addProduct]);
  
  const increaseQuantity = useCallback(() => {
    if (item) {
      updateQuantity(item.id, quantity + 1);
    }
  }, [item, quantity, updateQuantity]);
  
  const decreaseQuantity = useCallback(() => {
    if (item && quantity > 1) {
      updateQuantity(item.id, quantity - 1);
    } else if (item) {
      removeItem(item.id);
    }
  }, [item, quantity, updateQuantity, removeItem]);
  
  const removeFromCart = useCallback(() => {
    if (item) {
      removeItem(item.id);
    }
  }, [item, removeItem]);
  
  return {
    item,
    quantity,
    inCart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart
  };
}

// 🔧 EXPORT DEL TIPO PARA USAR EN OTROS LUGARES
export type { UseCartReturn, CartState };