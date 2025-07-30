// public/js/cart.js - SCRIPT PRINCIPAL UNIFICADO
console.log('🛒 Iniciando sistema de carrito unificado v3.0...');

// ✅ CONSTANTES DEL CARRITO
const CART_CONFIG = {
  STORAGE_KEY: 'martek-cart',
  FREE_SHIPPING_THRESHOLD: 100000,
  TAX_RATE: 0.19,
  SHIPPING_COST: 15000,
  NOTIFICATION_DURATION: 3000,
  
  EVENTS: {
    UPDATED: 'cart:updated',
    ADDED: 'cart:added', 
    REMOVED: 'cart:removed',
    CLEARED: 'cart:cleared'
  }
};

// ✅ UTILIDADES DE PRECIO
const PriceUtils = {
  validate(price) {
    const parsed = typeof price === 'string' ? parseFloat(price) : price;
    return (typeof parsed === 'number' && !isNaN(parsed) && parsed >= 0) ? parsed : 0;
  },

  format(price) {
    try {
      const validPrice = this.validate(price);
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(validPrice);
    } catch (error) {
      return `${price?.toLocaleString('es-CO') || 0}`;
    }
  },

  // ✅ MÉTODO FALTANTE PARA CHECKOUT
  calculateItemTotal(price, quantity) {
    const validPrice = this.validate(price);
    const validQuantity = Math.max(0, Math.floor(quantity || 0));
    return Math.round(validPrice * validQuantity);
  },

  // ✅ MÉTODO PARA COMPATIBILIDAD (usado por checkout)
  calculateCartTotals(items) {
    return this.calculateTotals(items);
  },

  calculateTotals(items) {
    if (!Array.isArray(items)) return { items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };
    
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => {
      const price = this.validate(item.product_price);
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    const shipping = subtotal >= CART_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CART_CONFIG.SHIPPING_COST;
    const tax = subtotal * CART_CONFIG.TAX_RATE;
    const total = subtotal + shipping + tax;

    return {
      items: totalItems,
      subtotal: Math.round(subtotal),
      shipping: Math.round(shipping),
      tax: Math.round(tax),
      total: Math.round(total)
    };
  }
};

// ✅ SISTEMA DE EVENTOS
const EventSystem = {
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data = null) {
    // Emitir a listeners internos
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback({ detail: data });
        } catch (error) {
          console.error(`Error en listener ${event}:`, error);
        }
      });
    }

    // Emitir evento DOM global
    try {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    } catch (error) {
      console.error(`Error emitiendo evento ${event}:`, error);
    }
  }
};

// ✅ GESTOR DE STORAGE
const CartStorage = {
  getItems() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(CART_CONFIG.STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      
      // Validar estructura de datos
      return Array.isArray(items) ? items.filter(this.isValidItem) : [];
    } catch (error) {
      console.error('❌ Error leyendo carrito:', error);
      return [];
    }
  },

  saveItems(items) {
    if (typeof window === 'undefined') return false;
    
    try {
      const validItems = Array.isArray(items) ? items.filter(this.isValidItem) : [];
      localStorage.setItem(CART_CONFIG.STORAGE_KEY, JSON.stringify(validItems));
      return true;
    } catch (error) {
      console.error('❌ Error guardando carrito:', error);
      return false;
    }
  },

  isValidItem(item) {
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
};

// ✅ SISTEMA DE NOTIFICACIONES
const NotificationSystem = {
  show(message, type = 'info', duration = CART_CONFIG.NOTIFICATION_DURATION) {
    // Remover notificación existente si hay una
    const existing = document.getElementById('cart-notification');
    if (existing) existing.remove();

    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.id = 'cart-notification';
    notification.className = `
      fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300
      ${this.getTypeClasses(type)}
    `;
    notification.textContent = message;

    // Agregar al DOM
    document.body.appendChild(notification);

    // Auto-remover
    setTimeout(() => {
      notification.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  getTypeClasses(type) {
    const classes = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white', 
      info: 'bg-blue-600 text-white',
      warning: 'bg-yellow-600 text-white'
    };
    return classes[type] || classes.info;
  }
};

// ✅ API PRINCIPAL DEL CARRITO
const CartAPI = {
  // Estado interno
  items: [],
  totals: { items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 },
  isInitialized: false,

  // ✅ INICIALIZACIÓN
  init() {
    if (this.isInitialized) return;
    
    try {
      this.items = CartStorage.getItems();
      this.totals = PriceUtils.calculateTotals(this.items);
      this.isInitialized = true;
      
      console.log(`✅ Carrito inicializado con ${this.items.length} items`);
      
      // Emitir evento inicial
      EventSystem.emit(CART_CONFIG.EVENTS.UPDATED, {
        items: this.items,
        totals: this.totals
      });
    } catch (error) {
      console.error('❌ Error inicializando carrito:', error);
    }
  },

  // ✅ OBTENER ITEMS
  getItems() {
    if (!this.isInitialized) this.init();
    return [...this.items];
  },

  // ✅ AGREGAR PRODUCTO (compatible con useCart.ts)
  addProduct(data) {
    try {
      const {
        product_id,
        product_name,
        product_price,
        quantity = 1,
        product_image = null,
        product_category = null
      } = data;

      // Validar datos requeridos
      if (!product_id || !product_name || !product_price) {
        throw new Error('Datos de producto incompletos');
      }

      const validPrice = PriceUtils.validate(product_price);
      const validQuantity = Math.max(1, Math.floor(quantity));

      // Buscar si ya existe
      const existingIndex = this.items.findIndex(item => item.product_id === product_id);

      if (existingIndex >= 0) {
        // Actualizar cantidad existente
        this.items[existingIndex].quantity += validQuantity;
        this.items[existingIndex].updated_at = new Date().toISOString();
      } else {
        // Crear nuevo item
        const newItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id,
          user_id: null,
          quantity: validQuantity,
          product_name,
          product_price: validPrice,
          product_image,
          product_category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        this.items.push(newItem);
      }

      // Actualizar totales y guardar
      this.totals = PriceUtils.calculateTotals(this.items);
      CartStorage.saveItems(this.items);

      // Notificar y emitir eventos
      NotificationSystem.show(`${product_name} agregado al carrito`, 'success');
      
      EventSystem.emit(CART_CONFIG.EVENTS.ADDED, {
        items: this.items,
        totals: this.totals,
        addedItem: this.items[existingIndex] || this.items[this.items.length - 1]
      });
      
      EventSystem.emit(CART_CONFIG.EVENTS.UPDATED, {
        items: this.items,
        totals: this.totals
      });

      return true;
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      NotificationSystem.show('Error agregando producto al carrito', 'error');
      return false;
    }
  },

  // ✅ ACTUALIZAR CANTIDAD
  updateQuantity(itemId, quantity) {
    try {
      const validQuantity = Math.max(0, Math.floor(quantity));
      
      if (validQuantity === 0) {
        return this.removeItem(itemId);
      }

      const index = this.items.findIndex(item => item.id === itemId);
      if (index === -1) return false;

      this.items[index].quantity = validQuantity;
      this.items[index].updated_at = new Date().toISOString();

      this.totals = PriceUtils.calculateTotals(this.items);
      CartStorage.saveItems(this.items);

      EventSystem.emit(CART_CONFIG.EVENTS.UPDATED, {
        items: this.items,
        totals: this.totals
      });

      return true;
    } catch (error) {
      console.error('❌ Error actualizando cantidad:', error);
      return false;
    }
  },

  // ✅ REMOVER ITEM
  removeItem(itemId) {
    try {
      const index = this.items.findIndex(item => item.id === itemId);
      if (index === -1) return false;

      const removedItem = this.items[index];
      this.items.splice(index, 1);

      this.totals = PriceUtils.calculateTotals(this.items);
      CartStorage.saveItems(this.items);

      NotificationSystem.show(`${removedItem.product_name} eliminado del carrito`, 'info');

      EventSystem.emit(CART_CONFIG.EVENTS.REMOVED, {
        items: this.items,
        totals: this.totals,
        removedItem
      });

      EventSystem.emit(CART_CONFIG.EVENTS.UPDATED, {
        items: this.items,
        totals: this.totals
      });

      return true;
    } catch (error) {
      console.error('❌ Error removiendo item:', error);
      return false;
    }
  },

  // ✅ LIMPIAR CARRITO
  clear() {
    try {
      this.items = [];
      this.totals = { items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };
      
      CartStorage.saveItems(this.items);
      NotificationSystem.show('Carrito vaciado', 'info');

      EventSystem.emit(CART_CONFIG.EVENTS.CLEARED, {
        items: this.items,
        totals: this.totals
      });

      EventSystem.emit(CART_CONFIG.EVENTS.UPDATED, {
        items: this.items,
        totals: this.totals
      });

      return true;
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
      return false;
    }
  },

  // ✅ OBTENER TOTALES
  getTotalItems() {
    return this.totals.items;
  },

  getTotalPrice() {
    return this.totals.total;
  },

  // ✅ FORMATEAR PRECIO
  formatPrice(price) {
    return PriceUtils.format(price);
  },

  // ✅ EVENTOS (compatible con useCart.ts)
  on(event, callback) {
    EventSystem.on(event, callback);
  },

  off(event, callback) {
    EventSystem.off(event, callback);
  },

  emit(event, data) {
    EventSystem.emit(event, data);
  },

  // ✅ NOTIFICACIONES
  showNotification(message, type = 'info') {
    NotificationSystem.show(message, type);
  }
};

// ✅ FUNCIÓN SIMPLE PARA BOTONES (compatible con [slug].astro)
function addToCart(productId, productName, productPrice, quantity = 1, productImage = null, productCategory = null) {
  return CartAPI.addProduct({
    product_id: productId,
    product_name: productName,
    product_price: productPrice,
    quantity,
    product_image: productImage,
    product_category: productCategory
  });
}

// ✅ ADAPTER PARA COMPATIBILIDAD CON CHECKOUT.ASTRO
const CartManager = {
  getItems() {
    return CartAPI.getItems();
  },
  
  addItem(productId, productName, productPrice, quantity = 1, productImage = null, productCategory = null) {
    return CartAPI.addProduct({
      product_id: productId,
      product_name: productName,
      product_price: productPrice,
      quantity,
      product_image: productImage,
      product_category: productCategory
    });
  },
  
  updateItemQuantity(itemId, quantity) {
    return CartAPI.updateQuantity(itemId, quantity);
  },
  
  removeItem(itemId) {
    return CartAPI.removeItem(itemId);
  },
  
  clearCart() {
    return CartAPI.clear();
  },
  
  getTotals() {
    return {
      items: CartAPI.getTotalItems(),
      subtotal: CartAPI.totals.subtotal,
      shipping: CartAPI.totals.shipping,
      tax: CartAPI.totals.tax,
      total: CartAPI.getTotalPrice()
    };
  },
  
  isEmpty() {
    return CartAPI.getItems().length === 0;
  },
  
  getCheckoutSummary() {
    const items = CartAPI.getItems();
    const totals = this.getTotals();
    
    return {
      items,
      totals,
      itemCount: totals.items,
      isEmpty: items.length === 0
    };
  }
};

// ✅ INICIALIZACIÓN AUTOMÁTICA Y ASIGNACIÓN GLOBAL
if (typeof window !== 'undefined') {
  // Inicializar sistema
  CartAPI.init();
  
  // Asignar APIs globales
  window.CartAPI = CartAPI;           // Para useCart.ts
  window.CartManager = CartManager;   // Para checkout.astro
  window.addToCart = addToCart;       // Para botones
  window.PriceUtils = PriceUtils;     // Para utilidades
  
  // Funciones adicionales de conveniencia
  window.updateCartQuantity = (itemId, quantity) => CartAPI.updateQuantity(itemId, quantity);
  window.removeFromCart = (itemId) => CartAPI.removeItem(itemId);
  window.clearCart = () => CartAPI.clear();
  window.getCartItems = () => CartAPI.getItems();
  window.getCartTotals = () => CartManager.getTotals();

  console.log('✅ Sistema de carrito unificado listo');
  
  // Debug info
  console.log('📦 APIs disponibles:', {
    CartAPI: '✅',
    CartManager: '✅',
    addToCart: '✅', 
    PriceUtils: '✅',
    EventSystem: '✅'
  });
}