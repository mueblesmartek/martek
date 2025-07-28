// src/hooks/useCartStorage.ts - HOOK CORREGIDO PARA CHECKOUT
import { useState, useEffect, useCallback } from 'react';
import type { Product, CartItem } from '../lib/types';

// ✅ CLAVE CONSISTENTE CON TODOS LOS SCRIPTS DEL PROYECTO
const CART_STORAGE_KEY = 'kamasex-cart';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

// ✅ FUNCIONES DE LOCALSTORAGE ROBUSTAS
function getStoredCart(): CartItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored);
    if (!Array.isArray(items)) return [];
    
    // Validar y limpiar items corruptos
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
    
    // Validar items antes de guardar
    const validItems = items.filter(item => {
      return item && 
             typeof item === 'object' && 
             item.id && 
             item.product_id && 
             item.product_name && 
             typeof item.product_price === 'number' && 
             typeof item.quantity === 'number' && 
             item.quantity > 0;
    });
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
    
    // Disparar evento personalizado para sincronizar con otros components
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: validItems }));
    
    // También disparar evento para compatibilidad con scripts de Astro
    window.dispatchEvent(new CustomEvent('cart-updated', { 
      detail: { 
        items: validItems,
        total: validItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0),
        itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0)
      } 
    }));
    
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ✅ HOOK PRINCIPAL MEJORADO
export function useCartStorage() {
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
    
    setState(prev => ({
      ...prev,
      items,
      total,
      itemCount
    }));
  }, []);

  // ✅ CARGAR CARRITO INICIAL
  useEffect(() => {
    const items = getStoredCart();
    updateState(items);
    setState(prev => ({ ...prev, isLoading: false }));
  }, [updateState]);

  // ✅ ESCUCHAR CAMBIOS ENTRE COMPONENTS Y STORAGE
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (Array.isArray(event.detail)) {
        updateState(event.detail);
      } else if (event.detail?.items && Array.isArray(event.detail.items)) {
        updateState(event.detail.items);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) {
        const items = getStoredCart();
        updateState(items);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateState]);

  // ✅ AGREGAR PRODUCTO AL CARRITO
  const addItem = useCallback(async (product: Product, quantity: number = 1): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const currentItems = getStoredCart();
      const existingItemIndex = currentItems.findIndex(item => item.product_id === product.id);

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Actualizar cantidad del producto existente
        const existingItem = currentItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Validar stock si está disponible
        if (product.stock && newQuantity > product.stock) {
          showNotification(`Solo hay ${product.stock} unidades disponibles`, 'error');
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        updatedItems = currentItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: newQuantity, updated_at: new Date().toISOString() }
            : item
        );
      } else {
        // Agregar nuevo producto
        const newItem: CartItem = {
          id: generateCartItemId(),
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image_url || '',
          product_category: product.category || '',
          quantity: quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        updatedItems = [...currentItems, newItem];
      }

      saveCartToStorage(updatedItems);
      updateState(updatedItems);
      
      showNotification(`${product.name} agregado al carrito`, 'success');
      
    } catch (error) {
      console.error('Error adding item to cart:', error);
      showNotification('Error agregando producto al carrito', 'error');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateState]);

  // ✅ REMOVER PRODUCTO DEL CARRITO
  const removeItem = useCallback(async (productId: string): Promise<void> => {
    try {
      const currentItems = getStoredCart();
      const updatedItems = currentItems.filter(item => item.product_id !== productId);
      
      saveCartToStorage(updatedItems);
      updateState(updatedItems);
      
      showNotification('Producto removido del carrito', 'info');
      
    } catch (error) {
      console.error('Error removing item from cart:', error);
      showNotification('Error removiendo producto del carrito', 'error');
    }
  }, [updateState]);

  // ✅ ACTUALIZAR CANTIDAD
  const updateQuantity = useCallback(async (productId: string, newQuantity: number): Promise<void> => {
    try {
      if (newQuantity <= 0) {
        await removeItem(productId);
        return;
      }

      const currentItems = getStoredCart();
      const itemIndex = currentItems.findIndex(item => item.product_id === productId);
      
      if (itemIndex >= 0) {
        const updatedItems = currentItems.map((item, index) =>
          index === itemIndex
            ? { ...item, quantity: newQuantity, updated_at: new Date().toISOString() }
            : item
        );
        
        saveCartToStorage(updatedItems);
        updateState(updatedItems);
      }
      
    } catch (error) {
      console.error('Error updating item quantity:', error);
      showNotification('Error actualizando cantidad', 'error');
    }
  }, [removeItem, updateState]);

  // ✅ LIMPIAR CARRITO
  const clearCart = useCallback(async (): Promise<void> => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      updateState([]);
      
      // Disparar eventos para sincronización
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { items: [], total: 0, itemCount: 0 } 
      }));
      
      showNotification('Carrito vaciado', 'info');
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      showNotification('Error vaciando carrito', 'error');
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

  // ✅ OBTENER RESUMEN DEL CARRITO (para checkout)
  const getCartSummary = useCallback(() => {
    return {
      items: state.items,
      subtotal: state.total,
      itemCount: state.itemCount,
      isEmpty: state.items.length === 0
    };
  }, [state]);

  // ✅ MOSTRAR NOTIFICACIÓN
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    // Remover notificaciones existentes
    const existing = document.querySelectorAll('.cart-notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `cart-notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300`;
    
    switch (type) {
      case 'success':
        notification.className += ' bg-green-50 border-green-200 text-green-800';
        break;
      case 'error':
        notification.className += ' bg-red-50 border-red-200 text-red-800';
        break;
      case 'info':
        notification.className += ' bg-blue-50 border-blue-200 text-blue-800';
        break;
    }
    
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-3 opacity-50 hover:opacity-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  };

  return {
    // Estado
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    isLoading: state.isLoading,
    
    // Acciones principales
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Funciones de utilidad
    getItemByProductId,
    isInCart,
    getProductQuantity,
    getCartSummary,
    
    // Para compatibilidad con componentes existentes
    showNotification
  };
}