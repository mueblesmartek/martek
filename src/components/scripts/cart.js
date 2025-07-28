// src/scripts/cart.js - SISTEMA COMPLETO DE CARRITO COMPATIBLE CON TYPESCRIPT
console.log('🛒 Iniciando sistema de carrito...');

// ✅ CONSTANTES (mismas que useCartStorage.ts)
const CART_STORAGE_KEY = 'kamasex-cart';

const CART_EVENTS = {
  UPDATED: 'cart-updated',
  ITEM_ADDED: 'cart-item-added',
  ITEM_REMOVED: 'cart-item-removed',
  CLEARED: 'cart-cleared'
};

// ✅ TIPOS Y VALIDACIONES (basado en types.ts)
const validateProduct = (product) => {
  if (!product || typeof product !== 'object') {
    throw new Error('Producto inválido');
  }
  
  const required = ['id', 'name', 'price'];
  for (const field of required) {
    if (!product[field]) {
      throw new Error(`Campo requerido: ${field}`);
    }
  }
  
  if (typeof product.price !== 'number' || product.price <= 0) {
    throw new Error('Precio debe ser un número positivo');
  }
  
  return true;
};

const validateCartItem = (item) => {
  const required = ['id', 'product_id', 'product_name', 'product_price', 'quantity'];
  for (const field of required) {
    if (item[field] === undefined || item[field] === null) {
      console.warn(`Campo faltante en CartItem: ${field}`);
    }
  }
  return true;
};

// ✅ FUNCIONES DE STORAGE (exactas a useCartStorage.ts)
const CartStorage = {
  getItems() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      
      // Validar items y limpiar corruptos
      return items.filter(item => {
        try {
          validateCartItem(item);
          return true;
        } catch (error) {
          console.warn('Removiendo item corrupto del carrito:', item, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error leyendo carrito:', error);
      return [];
    }
  },

  setItems(items) {
    if (typeof window === 'undefined') return;
    
    try {
      // Validar items antes de guardar
      const validItems = items.filter(item => {
        try {
          validateCartItem(item);
          return true;
        } catch (error) {
          console.warn('Skipping invalid item:', item, error);
          return false;
        }
      });
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
      
      // Disparar evento para sincronización con React
      window.dispatchEvent(new CustomEvent(CART_EVENTS.UPDATED, { 
        detail: { items: validItems } 
      }));
      
      console.log(`💾 Carrito guardado: ${validItems.length} items`);
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  },

  addItem(product, quantity = 1) {
    try {
      validateProduct(product);
      
      if (typeof quantity !== 'number' || quantity <= 0) {
        throw new Error('Cantidad debe ser un número positivo');
      }
      
      const items = this.getItems();
      const existingIndex = items.findIndex(item => item.product_id === product.id);
      
      if (existingIndex >= 0) {
        // Actualizar cantidad existente
        items[existingIndex].quantity += quantity;
        items[existingIndex].updated_at = new Date().toISOString();
        console.log(`📦 Actualizando cantidad: ${items[existingIndex].product_name} -> ${items[existingIndex].quantity}`);
      } else {
        // Agregar nuevo item (estructura compatible con CartItem type)
        const newItem = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: product.id,
          user_id: null, // Para usuarios no logueados
          quantity: quantity,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image_url || null,
          product_category: product.category || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        items.push(newItem);
        console.log(`➕ Nuevo item agregado: ${product.name}`);
      }
      
      this.setItems(items);
      
      // Disparar evento específico
      window.dispatchEvent(new CustomEvent(CART_EVENTS.ITEM_ADDED, {
        detail: { product, quantity }
      }));
      
      return items;
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
      return this.getItems();
    }
  },

  removeItem(itemId) {
    try {
      const items = this.getItems();
      const item = items.find(i => i.id === itemId);
      const filteredItems = items.filter(i => i.id !== itemId);
      
      this.setItems(filteredItems);
      
      if (item) {
        console.log(`🗑️ Item removido: ${item.product_name}`);
        window.dispatchEvent(new CustomEvent(CART_EVENTS.ITEM_REMOVED, {
          detail: { itemId }
        }));
      }
      
      return filteredItems;
    } catch (error) {
      console.error('Error removiendo item:', error);
      return this.getItems();
    }
  },

  updateQuantity(itemId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeItem(itemId);
      }
      
      if (typeof quantity !== 'number') {
        throw new Error('Cantidad debe ser un número');
      }
      
      const items = this.getItems();
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: quantity,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      });
      
      this.setItems(updatedItems);
      console.log(`📝 Cantidad actualizada: ${itemId} -> ${quantity}`);
      return updatedItems;
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      return this.getItems();
    }
  },

  clearCart() {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      
      window.dispatchEvent(new CustomEvent(CART_EVENTS.CLEARED));
      console.log('🧹 Carrito vaciado');
      
      return [];
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      return this.getItems();
    }
  },

  // Métodos de cálculo
  getTotalItems() {
    return this.getItems().reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice() {
    return this.getItems().reduce((total, item) => {
      return total + (item.product_price * item.quantity);
    }, 0);
  },

  getItemByProductId(productId) {
    return this.getItems().find(item => item.product_id === productId);
  },

  // Formateo de precio (compatible con useCartStorage)
  formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  },

  // Notificaciones
  showNotification(message, type = 'success') {
    // Remover notificaciones existentes
    const existing = document.querySelectorAll('.cart-notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `cart-notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Estilos según tipo
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
      default:
        notification.className += ' bg-gray-50 border-gray-200 text-gray-800';
    }
    
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            ${type === 'success' ? `
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            ` : type === 'error' ? `
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            ` : `
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            `}
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="ml-4 flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    requestAnimationFrame(() => {
      notification.classList.remove('translate-x-full');
    });
    
    // Auto remover después de 4 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }
};

// ✅ CLASE PRINCIPAL DEL CARRITO
class CartManager {
  constructor() {
    this.isLoading = false;
    this.init();
  }

  init() {
    console.log('🚀 Inicializando CartManager...');
    this.setupEventListeners();
    this.updateUI();
    this.setupGlobalFunctions();
    console.log('✅ CartManager inicializado');
  }

  setupEventListeners() {
    // Escuchar cambios de storage desde otras pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === CART_STORAGE_KEY) {
        console.log('🔄 Sincronizando carrito desde otra pestaña');
        this.updateUI();
      }
    });

    // Escuchar eventos custom del carrito
    window.addEventListener(CART_EVENTS.UPDATED, () => {
      this.updateUI();
    });

    window.addEventListener(CART_EVENTS.ITEM_ADDED, (e) => {
      const { product } = e.detail;
      CartStorage.showNotification(`${product.name} agregado al carrito`, 'success');
    });

    window.addEventListener(CART_EVENTS.ITEM_REMOVED, (e) => {
      CartStorage.showNotification('Producto removido del carrito', 'info');
    });

    window.addEventListener(CART_EVENTS.CLEARED, () => {
      CartStorage.showNotification('Carrito vaciado', 'info');
    });
  }

  setupGlobalFunctions() {
    // ✅ FUNCIONES GLOBALES PARA COMPATIBILIDAD CON .astro
    
    // Función simple para botones básicos
    window.addToCart = (id, name, price, quantity = 1) => {
      const product = {
        id: String(id),
        name: String(name),
        price: Number(price),
        image_url: null,
        category: ''
      };
      CartStorage.addItem(product, quantity);
    };

    // Función completa para ProductCard y páginas de producto
    window.addProductToCart = (id, name, price, image, category, buttonElement) => {
      const product = {
        id: String(id),
        name: String(name),
        price: Number(price),
        image_url: image || null,
        category: category || ''
      };

      CartStorage.addItem(product, 1);

      // Feedback visual en botón si se proporciona
      if (buttonElement) {
        const originalText = buttonElement.textContent;
        const originalClass = buttonElement.className;
        
        buttonElement.textContent = '¡Agregado!';
        buttonElement.className = originalClass.replace(/bg-gray-\d+/, 'bg-green-600');
        buttonElement.disabled = true;
        
        setTimeout(() => {
          buttonElement.textContent = originalText;
          buttonElement.className = originalClass;
          buttonElement.disabled = false;
        }, 1500);
      }
    };

    // API pública compatible con useCartStorage
    window.CartUtils = CartStorage;

    // Constantes públicas
    window.CART_EVENTS = CART_EVENTS;
  }

  updateUI() {
    this.updateCartCounter();
    this.updateCartPreview();
    this.renderCartPage();
  }

  updateCartCounter() {
    const totalItems = CartStorage.getTotalItems();
    const counters = document.querySelectorAll('[data-cart-counter]');
    
    counters.forEach(counter => {
      counter.textContent = totalItems;
      
      // Mostrar/ocultar badge
      if (totalItems > 0) {
        counter.classList.remove('hidden');
        counter.classList.add('flex');
      } else {
        counter.classList.add('hidden');
        counter.classList.remove('flex');
      }
    });
  }

  updateCartPreview() {
    const preview = document.getElementById('cart-preview');
    if (!preview) return;

    const items = CartStorage.getItems();
    
    if (items.length === 0) {
      preview.innerHTML = `
        <div class="text-center py-6">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"/>
          </svg>
          <p class="text-sm text-gray-500">Tu carrito está vacío</p>
        </div>
      `;
      return;
    }

    const displayItems = items.slice(0, 3);
    const remaining = items.length - displayItems.length;
    const total = CartStorage.getTotalPrice();

    preview.innerHTML = `
      <div class="space-y-3 mb-4">
        ${displayItems.map(item => `
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
              ${item.product_image ? `
                <img src="${item.product_image}" alt="${item.product_name}" class="w-full h-full object-cover">
              ` : `
                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
              `}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">${item.product_name}</p>
              <p class="text-xs text-gray-500">${item.quantity}x ${CartStorage.formatPrice(item.product_price)}</p>
            </div>
          </div>
        `).join('')}
        
        ${remaining > 0 ? `
          <p class="text-xs text-gray-500 text-center border-t pt-2">
            +${remaining} producto${remaining > 1 ? 's' : ''} más
          </p>
        ` : ''}
      </div>
      
      <div class="border-t pt-3">
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm font-medium">Total:</span>
          <span class="text-sm font-bold">${CartStorage.formatPrice(total)}</span>
        </div>
        <div class="space-y-2">
          <a href="/carrito" 
             class="block w-full bg-gray-900 text-white text-center py-2 rounded-md text-sm hover:bg-gray-800 transition-colors">
            Ver carrito (${CartStorage.getTotalItems()})
          </a>
          <a href="/checkout" 
             class="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
            Checkout
          </a>
        </div>
      </div>
    `;
  }

  renderCartPage() {
    // Solo ejecutar en página de carrito
    if (!window.location.pathname.includes('/carrito')) return;

    const items = CartStorage.getItems();
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');
    const cartItems = document.getElementById('cart-items');

    if (items.length === 0) {
      if (emptyCart) emptyCart.classList.remove('hidden');
      if (cartContent) cartContent.classList.add('hidden');
      return;
    }

    if (emptyCart) emptyCart.classList.add('hidden');
    if (cartContent) cartContent.classList.remove('hidden');

    if (cartItems) {
      cartItems.innerHTML = this.renderCartItems();
    }

    this.renderCartSummary();
  }

  renderCartItems() {
    const items = CartStorage.getItems();
    
    return `
      <div class="space-y-4">
        ${items.map(item => `
          <div class="flex items-center space-x-4 p-4 bg-white rounded-lg border" data-item-id="${item.id}">
            <div class="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
              ${item.product_image ? `
                <img src="${item.product_image}" alt="${item.product_name}" class="w-full h-full object-cover">
              ` : `
                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
              `}
            </div>
            
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 truncate">${item.product_name}</h4>
              <p class="text-sm text-gray-500">${CartStorage.formatPrice(item.product_price)}</p>
              ${item.product_category ? `
                <p class="text-xs text-gray-400">${item.product_category}</p>
              ` : ''}
            </div>
            
            <div class="flex items-center space-x-2">
              <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})"
                      class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                      ${item.quantity <= 1 ? 'disabled' : ''}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                </svg>
              </button>
              
              <span class="w-8 text-center text-sm font-medium">${item.quantity}</span>
              
              <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})"
                      class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </button>
            </div>
            
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">
                ${CartStorage.formatPrice(item.product_price * item.quantity)}
              </p>
              <button onclick="cartManager.removeItem('${item.id}')"
                      class="text-red-600 hover:text-red-800 text-sm mt-1 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCartSummary() {
    const summaryContainer = document.getElementById('cart-summary');
    if (!summaryContainer) return;

    const subtotal = CartStorage.getTotalPrice();
    const shipping = subtotal > 100000 ? 0 : 15000;
    const tax = subtotal * 0.19;
    const total = subtotal + shipping + tax;
    const totalItems = CartStorage.getTotalItems();

    summaryContainer.innerHTML = `
      <div class="bg-white rounded-lg border p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Resumen del pedido</h3>
        
        <div class="space-y-3 mb-6">
          <div class="flex justify-between text-sm">
            <span>Productos (${totalItems})</span>
            <span>${CartStorage.formatPrice(subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Envío</span>
            <span class="${shipping === 0 ? 'text-green-600 font-medium' : ''}">${shipping === 0 ? 'Gratis' : CartStorage.formatPrice(shipping)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>IVA (19%)</span>
            <span>${CartStorage.formatPrice(tax)}</span>
          </div>
          <div class="border-t pt-3 flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>${CartStorage.formatPrice(total)}</span>
          </div>
        </div>

        ${shipping === 0 ? `
          <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p class="text-green-800 text-sm font-medium flex items-center">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              ✓ Envío gratis
            </p>
          </div>
        ` : `
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p class="text-blue-800 text-sm">
              Agrega ${CartStorage.formatPrice(100000 - subtotal)} más para envío gratis
            </p>
          </div>
        `}

        <div class="space-y-3">
          <a href="/checkout" 
             class="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors text-center block font-medium">
            Proceder al checkout
          </a>
          <button onclick="cartManager.clearCart()" 
                  class="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
            Vaciar carrito
          </button>
        </div>
      </div>
    `;
  }

  // Métodos delegados a CartStorage
  addItem(product, quantity) {
    return CartStorage.addItem(product, quantity);
  }

  removeItem(itemId) {
    return CartStorage.removeItem(itemId);
  }

  updateQuantity(itemId, quantity) {
    return CartStorage.updateQuantity(itemId, quantity);
  }

  clearCart() {
    const result = CartStorage.clearCart();
    this.updateUI();
    return result;
  }
}

// ✅ INICIALIZACIÓN GLOBAL
let cartManager;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    cartManager = new CartManager();
  });
} else {
  // DOM ya está listo
  cartManager = new CartManager();
}

// Hacer disponible globalmente para debugging
window.CartManager = {
  addItem: CartJS.addItem.bind(CartJS),
  removeItem: CartJS.removeItem.bind(CartJS),
  updateQuantity: CartJS.updateQuantity.bind(CartJS),
  getItems: CartJS.getItems.bind(CartJS),
  clearCart: CartJS.clearCart.bind(CartJS),
  getTotal: CartJS.getTotal.bind(CartJS),
  getItemCount: CartJS.getItemCount.bind(CartJS)
};

// ✅ INICIALIZAR CARRITO AL CARGAR
CartJS.init();

console.log('🛒 CartManager disponible globalmente');