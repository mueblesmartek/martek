// src/hooks/useCartStorage.ts - VERSIÓN CORREGIDA COMPATIBLE CON SISTEMA UNIFICADO
import { useState, useEffect, useCallback } from 'react';
import type { Product, CartItem } from '../lib/types';

// ✅ MISMA CLAVE QUE EL SISTEMA UNIFICADO
const CART_STORAGE_KEY = 'martek-cart';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

interface UseCartStorageReturn {
  // Estado
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  
  // Acciones
  addItem: (product: Product, quantity?: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  
  // Utilidades
  getItemByProductId: (productId: string) => CartItem | null;
  isInCart: (productId: string) => boolean;
  getProductQuantity: (productId: string) => number;
  formatPrice: (price: number) => string;
}

// ✅ FUNCIONES DE UTILIDAD
function getStoredCart(): CartItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored);
    if (!Array.isArray(items)) return [];
    
    // Validar items
    return items.filter(item => {
      return item && 
             typeof item === 'object' && 
             item.id && 
             item.product_id && 
             item.product_name && 
             typeof item.product_price === 'number' && 
             typeof item.quantity === 'number' && 
             item.quantity > 0;
    });
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    
    // Disparar eventos para sincronización
    window.dispatchEvent(new CustomEvent('cart-updated', { 
      detail: { 
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
      } 
    }));
    
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

function generateCartItemId(productId: string): string {
  return `cart_${Date.now()}_${productId}`;
}

function formatPrice(price: number): string {
  try {
    const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(validPrice);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `$${price || 0}`;
  }
}

// ✅ HOOK PRINCIPAL
export function useCartStorage(): UseCartStorageReturn {
  const [state, setState] = useState<CartState>({
    items: [],
    total: 0,
    itemCount: 0,
    isLoading: true
  });

  // ✅ FUNCIÓN PARA ACTUALIZAR ESTADO
  const updateState = useCallback((items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    setState({
      items,
      total,
      itemCount,
      isLoading: false
    });
  }, []);

  // ✅ CARGAR CARRITO INICIAL
  useEffect(() => {
    const items = getStoredCart();
    updateState(items);
  }, [updateState]);

  // ✅ ESCUCHAR CAMBIOS DEL SISTEMA UNIFICADO
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail?.items && Array.isArray(event.detail.items)) {
        updateState(event.detail.items);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) {
        const items = getStoredCart();
        updateState(items);
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateState]);

  // ✅ AGREGAR ITEM - Compatible con sistema unificado
  const addItem = useCallback(async (product: Product, quantity: number = 1): Promise<boolean> => {
    try {
      // Si el sistema unificado está disponible, usarlo
      if (typeof window !== 'undefined' && window.cart) {
        return window.cart.addItem(product, quantity);
      }
      
      // Fallback: gestión manual
      const items = getStoredCart();
      const existingIndex = items.findIndex(item => item.product_id === product.id);
      
      if (existingIndex >= 0) {
        items[existingIndex].quantity += quantity;
        items[existingIndex].updated_at = new Date().toISOString();
      } else {
        const standardCartItem: CartItem = {
          id: generateCartItemId(product.id),
          user_id: null,
          product_id: product.id,
          quantity: quantity,
          created_at: new Date().toISOString(),
          product_name: product.name,
          product_price: product.price,
          product_image: product.image_url || null,
          product_category: product.category,
          updated_at: new Date().toISOString()
        };
        items.push(standardCartItem);
      }
      
      saveCartToStorage(items);
      updateState(items);
      return true;
      
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
  }, [updateState]);

  // ✅ REMOVER ITEM
  const removeItem = useCallback(async (productId: string): Promise<boolean> => {
    try {
      // Si el sistema unificado está disponible, usarlo
      if (typeof window !== 'undefined' && window.cart) {
        return window.cart.removeItem(productId);
      }
      
      // Fallback: gestión manual
      const items = getStoredCart();
      const filteredItems = items.filter(item => item.product_id !== productId);
      
      saveCartToStorage(filteredItems);
      updateState(filteredItems);
      return true;
      
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return false;
    }
  }, [updateState]);

  // ✅ ACTUALIZAR CANTIDAD
  const updateQuantity = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      if (quantity <= 0) {
        return await removeItem(productId);
      }
      
      // Si el sistema unificado está disponible, usarlo
      if (typeof window !== 'undefined' && window.cart) {
        return window.cart.updateQuantity(productId, quantity);
      }
      
      // Fallback: gestión manual
      const items = getStoredCart();
      const item = items.find(item => item.product_id === productId);
      
      if (item) {
        item.quantity = quantity;
        item.updated_at = new Date().toISOString();
        saveCartToStorage(items);
        updateState(items);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error updating item quantity:', error);
      return false;
    }
  }, [removeItem, updateState]);

  // ✅ LIMPIAR CARRITO
  const clearCart = useCallback(async (): Promise<void> => {
    try {
      // Si el sistema unificado está disponible, usarlo
      if (typeof window !== 'undefined' && window.cart) {
        window.cart.clearCart();
        return;
      }
      
      // Fallback: gestión manual
      localStorage.removeItem(CART_STORAGE_KEY);
      updateState([]);
      
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { items: [], totalItems: 0, totalPrice: 0 } 
      }));
      
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, [updateState]);

  // ✅ FUNCIONES DE UTILIDAD
  const getItemByProductId = useCallback((productId: string): CartItem | null => {
    return state.items.find(item => item.product_id === productId) || null;
  }, [state.items]);

  const isInCart = useCallback((productId: string): boolean => {
    return state.items.some(item => item.product_id === productId);
  }, [state.items]);

  const getProductQuantity = useCallback((productId: string): number => {
    const item = getItemByProductId(productId);
    return item ? item.quantity : 0;
  }, [getItemByProductId]);

  return {
    // Estado
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    isLoading: state.isLoading,
    
    // Acciones
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Utilidades
    getItemByProductId,
    isInCart,
    getProductQuantity,
    formatPrice
  };
}

// ✅ DECLARACIONES GLOBALES PARA TYPESCRIPT
declare global {
  interface Window {
    cart?: {
      addItem: (product: any, quantity?: number) => boolean;
      removeItem: (productId: string) => boolean;
      updateQuantity: (productId: string, quantity: number) => boolean;
      clearCart: () => boolean;
      items: any[];
    };
  }
}