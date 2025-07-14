// src/stores/cartStore.ts
import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

// Tipos para el carrito
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  category: string;
  selectedVariant?: {
    color?: string;
    size?: string;
    material?: string;
  };
  addedAt: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  lastUpdated: string;
  couponCode?: string;
  couponDiscount?: number;
}

export interface CartSummary {
  itemCount: number;
  totalItems: number;
  subtotal: number;
  originalSubtotal: number;
  savings: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  currency: string;
}

// ===========================================
// STORES PRINCIPALES
// ===========================================

// Estado del carrito (persistente en localStorage)
export const cartStore = persistentAtom<CartState>('cart', {
  items: [],
  isOpen: false,
  lastUpdated: new Date().toISOString(),
  couponCode: undefined,
  couponDiscount: 0
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Estado de loading del carrito
export const cartLoading = atom<boolean>(false);

// Estado de error del carrito
export const cartError = atom<string | null>(null);

// ===========================================
// COMPUTED VALUES
// ===========================================

// Resumen del carrito calculado
export const cartSummary = computed(cartStore, (cart): CartSummary => {
  const items = cart.items;
  const freeShippingThreshold = 150000; // $150,000 COP
  
  // Calcular totales
  const itemCount = items.length;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const originalSubtotal = items.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price;
    return sum + (originalPrice * item.quantity);
  }, 0);
  const savings = originalSubtotal - subtotal;
  
  // Aplicar cupón de descuento
  const discountAmount = cart.couponDiscount || 0;
  const subtotalWithDiscount = Math.max(0, subtotal - discountAmount);
  
  // Calcular envío
  const shippingCost = subtotalWithDiscount >= freeShippingThreshold ? 0 : 15000;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotalWithDiscount);
  
  // Calcular impuestos (IVA 19%)
  const taxAmount = Math.round(subtotalWithDiscount * 0.19);
  
  // Total final
  const total = subtotalWithDiscount + shippingCost + taxAmount;

  return {
    itemCount,
    totalItems,
    subtotal: subtotalWithDiscount,
    originalSubtotal,
    savings: savings + discountAmount,
    shippingCost,
    taxAmount,
    total,
    freeShippingThreshold,
    freeShippingRemaining,
    currency: 'COP'
  };
});

// Verificar si el carrito está vacío
export const isCartEmpty = computed(cartStore, (cart) => cart.items.length === 0);

// Obtener cantidad total de items
export const cartItemCount = computed(cartStore, (cart) => 
  cart.items.reduce((sum, item) => sum + item.quantity, 0)
);

// ===========================================
// ACCIONES DEL CARRITO
// ===========================================

// Agregar item al carrito
export const addToCart = (product: {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
}, quantity: number = 1, variant?: any): void => {
  try {
    cartLoading.set(true);
    cartError.set(null);

    const cart = cartStore.get();
    const now = new Date().toISOString();

    // Verificar si ya existe un item similar
    const existingItemIndex = cart.items.findIndex(item => {
      if (item.productId !== product.id) return false;
      
      if (!variant && !item.selectedVariant) return true;
      if (!variant || !item.selectedVariant) return false;
      
      return (
        item.selectedVariant.color === variant.color &&
        item.selectedVariant.size === variant.size &&
        item.selectedVariant.material === variant.material
      );
    });

    if (existingItemIndex >= 0) {
      // Actualizar cantidad del item existente
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = Math.min(existingItem.quantity + quantity, 10); // Máximo 10

      cart.items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity
      };
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: Math.min(quantity, 10),
        image: product.image,
        category: product.category,
        selectedVariant: variant,
        addedAt: now
      };

      cart.items.push(newItem);
    }

    // Actualizar el store
    cartStore.set({
      ...cart,
      lastUpdated: now
    });

    // Mostrar notificación
    showCartNotification(`${product.name} agregado al carrito`);

  } catch (error) {
    console.error('Error agregando al carrito:', error);
    cartError.set('Error al agregar producto al carrito');
  } finally {
    cartLoading.set(false);
  }
};

// Actualizar cantidad de un item
export const updateCartItemQuantity = (itemId: string, quantity: number): void => {
  try {
    cartLoading.set(true);
    cartError.set(null);

    const cart = cartStore.get();
    const itemIndex = cart.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      cartError.set('Producto no encontrado en el carrito');
      return;
    }

    if (quantity <= 0) {
      // Eliminar item si la cantidad es 0 o menor
      cart.items.splice(itemIndex, 1);
    } else {
      // Actualizar cantidad
      const newQuantity = Math.min(quantity, 10);
      cart.items[itemIndex] = {
        ...cart.items[itemIndex],
        quantity: newQuantity
      };
    }

    cartStore.set({
      ...cart,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error actualizando cantidad:', error);
    cartError.set('Error al actualizar cantidad');
  } finally {
    cartLoading.set(false);
  }
};

// Eliminar item del carrito
export const removeFromCart = (itemId: string): void => {
  try {
    cartLoading.set(true);
    cartError.set(null);

    const cart = cartStore.get();
    const itemIndex = cart.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      cartError.set('Producto no encontrado en el carrito');
      return;
    }

    const removedItem = cart.items[itemIndex];
    cart.items.splice(itemIndex, 1);

    cartStore.set({
      ...cart,
      lastUpdated: new Date().toISOString()
    });

    showCartNotification(`${removedItem.name} eliminado del carrito`);
    
  } catch (error) {
    console.error('Error eliminando del carrito:', error);
    cartError.set('Error al eliminar producto');
  } finally {
    cartLoading.set(false);
  }
};

// Limpiar carrito
export const clearCart = (): void => {
  try {
    cartLoading.set(true);
    cartError.set(null);

    cartStore.set({
      items: [],
      isOpen: false,
      lastUpdated: new Date().toISOString(),
      couponCode: undefined,
      couponDiscount: 0
    });

    showCartNotification('Carrito vaciado');
    
  } catch (error) {
    console.error('Error limpiando carrito:', error);
    cartError.set('Error al limpiar carrito');
  } finally {
    cartLoading.set(false);
  }
};

// ===========================================
// GESTIÓN DE CUPONES
// ===========================================

// Aplicar cupón de descuento
export const applyCoupon = (couponCode: string): { success: boolean; discount?: number; message?: string } => {
  try {
    cartLoading.set(true);
    cartError.set(null);

    // Mock de validación de cupón
    const validCoupons: Record<string, { discount: number; type: 'fixed' | 'percentage' }> = {
      'BIENVENIDO10': { discount: 10, type: 'percentage' },
      'PRIMERA15': { discount: 15, type: 'percentage' },
      'DESCUENTO20K': { discount: 20000, type: 'fixed' },
      'VIP25': { discount: 25, type: 'percentage' }
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      cartError.set('Cupón inválido o expirado');
      return { success: false, message: 'Cupón inválido o expirado' };
    }

    const cart = cartStore.get();
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round(subtotal * (coupon.discount / 100));
    } else {
      discountAmount = coupon.discount;
    }

    // No permitir descuentos mayores al subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    cartStore.set({
      ...cart,
      couponCode: couponCode.toUpperCase(),
      couponDiscount: discountAmount,
      lastUpdated: new Date().toISOString()
    });

    showCartNotification(`Cupón ${couponCode} aplicado: -$${discountAmount.toLocaleString('es-CO')}`);
    
    return { 
      success: true, 
      discount: discountAmount,
      message: `Descuento de $${discountAmount.toLocaleString('es-CO')} aplicado`
    };

  } catch (error) {
    console.error('Error aplicando cupón:', error);
    cartError.set('Error al aplicar cupón');
    return { success: false, message: 'Error al aplicar cupón' };
  } finally {
    cartLoading.set(false);
  }
};

// Remover cupón
export const removeCoupon = (): void => {
  const cart = cartStore.get();
  cartStore.set({
    ...cart,
    couponCode: undefined,
    couponDiscount: 0,
    lastUpdated: new Date().toISOString()
  });

  showCartNotification('Cupón removido');
};

// ===========================================
// UI HELPERS
// ===========================================

// Abrir/cerrar carrito
export const toggleCart = (): void => {
  const cart = cartStore.get();
  cartStore.set({
    ...cart,
    isOpen: !cart.isOpen
  });
};

export const openCart = (): void => {
  const cart = cartStore.get();
  cartStore.set({
    ...cart,
    isOpen: true
  });
};

export const closeCart = (): void => {
  const cart = cartStore.get();
  cartStore.set({
    ...cart,
    isOpen: false
  });
};

// ===========================================
// NOTIFICACIONES
// ===========================================

// Sistema de notificaciones del carrito
const showCartNotification = (message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
  // Emitir evento personalizado para notificaciones
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-notification', {
      detail: { message, type }
    }));
    
    // También crear notificación visual directamente
    createToastNotification(message, type);
  }
};

// Crear notificación toast
const createToastNotification = (message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
  if (typeof window === 'undefined') return;
  
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'info' ? 'bg-blue-500' : 'bg-green-500';
  
  toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-md z-50 transform transition-all duration-300 translate-x-full shadow-lg`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// ===========================================
// EXPORTAR FUNCIONES DE UTILIDAD
// ===========================================

// Exportar carrito para checkout
export const exportCartForCheckout = () => {
  const cart = cartStore.get();
  const summary = cartSummary.get();

  return {
    items: cart.items,
    summary,
    couponCode: cart.couponCode,
    couponDiscount: cart.couponDiscount,
    lastUpdated: cart.lastUpdated
  };
};

// Obtener métricas del carrito
export const getCartMetrics = () => {
  const cart = cartStore.get();
  const summary = cartSummary.get();

  return {
    totalItems: summary.totalItems,
    uniqueProducts: cart.items.length,
    averageItemPrice: summary.totalItems > 0 ? summary.subtotal / summary.totalItems : 0,
    cartValue: summary.total,
    hasDiscount: !!cart.couponCode,
    discountAmount: cart.couponDiscount || 0,
    categories: [...new Set(cart.items.map(item => item.category))],
    lastActivity: cart.lastUpdated
  };
};

// Verificar si un producto está en el carrito
export const isInCart = (productId: string, variant?: any): boolean => {
  const cart = cartStore.get();
  return cart.items.some(item => {
    if (item.productId !== productId) return false;
    
    if (!variant && !item.selectedVariant) return true;
    if (!variant || !item.selectedVariant) return false;
    
    return (
      item.selectedVariant.color === variant.color &&
      item.selectedVariant.size === variant.size &&
      item.selectedVariant.material === variant.material
    );
  });
};

// Obtener cantidad de un producto específico en el carrito
export const getProductQuantityInCart = (productId: string, variant?: any): number => {
  const cart = cartStore.get();
  const item = cart.items.find(item => {
    if (item.productId !== productId) return false;
    
    if (!variant && !item.selectedVariant) return true;
    if (!variant || !item.selectedVariant) return false;
    
    return (
      item.selectedVariant.color === variant.color &&
      item.selectedVariant.size === variant.size &&
      item.selectedVariant.material === variant.material
    );
  });
  
  return item ? item.quantity : 0;
};

// ===========================================
// INICIALIZACIÓN
// ===========================================

// Inicializar el carrito
export const initializeCart = (): void => {
  if (typeof window === 'undefined') return;
  
  // Listener para notificaciones del carrito
  window.addEventListener('cart-notification', (event: any) => {
    const { message, type } = event.detail;
    createToastNotification(message, type);
  });
  
  // Limpiar items expirados (más de 7 días)
  const cart = cartStore.get();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const validItems = cart.items.filter(item => {
    const itemDate = new Date(item.addedAt);
    return itemDate > sevenDaysAgo;
  });
  
  if (validItems.length !== cart.items.length) {
    cartStore.set({
      ...cart,
      items: validItems,
      lastUpdated: new Date().toISOString()
    });
  }
};

// ===========================================
// MOCK DATA PARA TESTING
// ===========================================

// Función para agregar productos de prueba (solo para desarrollo)
export const addMockProducts = (): void => {
  const mockProducts = [
    {
      id: "mock-1",
      name: "Vibrador Premium de Prueba",
      price: 199000,
      originalPrice: 249000,
      image: "/images/productos/vibrador-premium.jpg",
      category: "Juguetes"
    },
    {
      id: "mock-2",
      name: "Lubricante Orgánico de Prueba",
      price: 45000,
      image: "/images/productos/lubricante-organico.jpg",
      category: "Lubricantes"
    }
  ];

  mockProducts.forEach(product => {
    addToCart(product, 1);
  });
};

// Inicializar carrito automáticamente
if (typeof window !== 'undefined') {
  initializeCart();
}