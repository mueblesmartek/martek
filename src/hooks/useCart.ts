// src/hooks/useCart.ts - HOOK SIMPLIFICADO PARA CART.JS
import { useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../lib/types';

// ✅ DECLARACIÓN GLOBAL PARA TYPESCRIPT
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
      }): boolean;
      updateQuantity(itemId: string, quantity: number): boolean;
      removeItem(itemId: string): boolean;
      clear(): boolean;
      getTotalItems(): number;
      getTotalPrice(): number;
      formatPrice(price: number): string;
      on(event: string, callback: (e: { detail: any }) => void): void;
      off(event: string, callback: (e: { detail: any }) => void): void;
      showNotification(message: string, type?: 'success' | 'error' | 'info' | 'warning'): void;
    };
  }
}

// ✅ INTERFACE DEL HOOK
interface UseCartReturn {
  // Estado
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  isReady: boolean;
  
  // Acciones
  addProduct: (data: {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity?: number;
    product_image?: string;
    product_category?: string;
  }) => boolean;
  updateQuantity: (itemId: string, quantity: number) => boolean;
  removeItem: (itemId: string) => boolean;
  clear: () => boolean;
  
  // Utilidades
  formatPrice: (price: number) => string;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  
  // Información específica
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  isEmpty: boolean;
}

/**
 * 🛒 Hook useCart - Versión Simplificada
 * 
 * Se conecta directamente con window.CartAPI del script unificado.
 * Maneja sincronización automática via eventos.
 */
export function useCart(): UseCartReturn {
  
  // ✅ ESTADO SIMPLIFICADO
  const [state, setState] = useState<{
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    isLoading: boolean;
    isReady: boolean;
  }>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    isLoading: true,
    isReady: false
  });

  // ✅ SINCRONIZAR CON CARTAPI
  const syncWithCartAPI = useCallback(() => {
    if (typeof window === 'undefined' || !window.CartAPI) {
      return;
    }

    try {
      const items = window.CartAPI.getItems();
      const totalItems = window.CartAPI.getTotalItems();
      const totalPrice = window.CartAPI.getTotalPrice();

      setState({
        items,
        totalItems,
        totalPrice,
        isLoading: false,
        isReady: true
      });

    } catch (error) {
      console.error('❌ Error sincronizando useCart:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false
      }));
    }
  }, []);

  // ✅ INICIALIZACIÓN CON EVENTOS
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let eventCleanup: (() => void) | null = null;
    
    const initializeCart = () => {
      if (typeof window !== 'undefined' && window.CartAPI) {
        // Sincronizar estado inicial
        syncWithCartAPI();
        
        // Configurar listener de eventos (un solo evento genérico)
        const handleCartChange = () => syncWithCartAPI();
        
        window.CartAPI.on('cart:updated', handleCartChange);
        
        // Cleanup function
        eventCleanup = () => {
          if (window.CartAPI) {
            window.CartAPI.off('cart:updated', handleCartChange);
          }
        };
        
        console.log('✅ useCart conectado a CartAPI');
      } else {
        // CartAPI no disponible, reintentar
        timeoutId = setTimeout(initializeCart, 100);
      }
    };

    initializeCart();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (eventCleanup) eventCleanup();
    };
  }, [syncWithCartAPI]);

  // ✅ FUNCIONES DE ACCIÓN (wrappers simples)
  const addProduct = useCallback((data: {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity?: number;
    product_image?: string;
    product_category?: string;
  }) => {
    if (window.CartAPI) {
      return window.CartAPI.addProduct(data);
    }
    console.warn('⚠️ CartAPI no disponible');
    return false;
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (window.CartAPI) {
      return window.CartAPI.updateQuantity(itemId, quantity);
    }
    return false;
  }, []);

  const removeItem = useCallback((itemId: string) => {
    if (window.CartAPI) {
      return window.CartAPI.removeItem(itemId);
    }
    return false;
  }, []);

  const clear = useCallback(() => {
    if (window.CartAPI) {
      return window.CartAPI.clear();
    }
    return false;
  }, []);

  const formatPrice = useCallback((price: number) => {
    if (window.CartAPI) {
      return window.CartAPI.formatPrice(price);
    }
    return `$${price?.toLocaleString('es-CO') || 0}`;
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (window.CartAPI) {
      window.CartAPI.showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }, []);

  // ✅ FUNCIONES DE CONSULTA
  const getItemQuantity = useCallback((productId: string): number => {
    return state.items.find(item => item.product_id === productId)?.quantity || 0;
  }, [state.items]);

  const isInCart = useCallback((productId: string): boolean => {
    return state.items.some(item => item.product_id === productId);
  }, [state.items]);

  // ✅ RETORNAR API COMPLETA
  return {
    // Estado
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    isLoading: state.isLoading,
    isReady: state.isReady,
    isEmpty: state.totalItems === 0,
    
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
 * 🎯 Hook ligero para componentes que solo necesitan info básica
 */
export function useCartInfo() {
  const { totalItems, totalPrice, formatPrice, isLoading, isReady, isEmpty } = useCart();
  
  return {
    totalItems,
    totalPrice,
    formattedTotal: formatPrice(totalPrice),
    isLoading,
    isReady,
    isEmpty
  };
}

/**
 * 📦 Hook especializado para manejar un producto específico
 */
export function useCartItem(productId: string) {
  const { 
    items, 
    addProduct, 
    updateQuantity, 
    removeItem, 
    getItemQuantity, 
    isInCart,
    isReady 
  } = useCart();
  
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
    return addProduct({
      product_id: productId,
      ...productData
    });
  }, [productId, addProduct]);

  const updateItemQuantity = useCallback((newQuantity: number) => {
    if (item) {
      return updateQuantity(item.id, newQuantity);
    }
    return false;
  }, [item, updateQuantity]);

  const removeFromCart = useCallback(() => {
    if (item) {
      return removeItem(item.id);
    }
    return false;
  }, [item, removeItem]);

  return {
    item,
    quantity,
    inCart,
    isReady,
    addToCart,
    updateQuantity: updateItemQuantity,
    removeFromCart
  };
}