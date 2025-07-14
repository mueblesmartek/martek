// src/scripts/cartIntegration.js
// Script para conectar el cartStore con el Header y otros componentes

// Importar las funciones del cartStore
import { 
  cartStore, 
  cartSummary, 
  cartItemCount,
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
  openCart,
  closeCart,
  addMockProducts
} from '../stores/cartStore.js';

// ===========================================
// INTEGRACIÓN CON EL HEADER
// ===========================================

class CartUI {
  constructor() {
    this.cartSidebar = null;
    this.cartOverlay = null;
    this.cartCounter = null;
    this.cartItemsContainer = null;
    this.cartTotal = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.findElements();
    this.bindEvents();
    this.subscribeToStore();
    this.updateUI();
    this.isInitialized = true;
    
    console.log('🛒 Cart UI inicializado correctamente');
  }

  findElements() {
    this.cartSidebar = document.getElementById('cart-sidebar');
    this.cartOverlay = document.getElementById('cart-overlay');
    this.cartCounter = document.querySelector('.cart-counter');
    this.cartItemsContainer = document.getElementById('cart-items');
    this.cartTotal = document.getElementById('cart-total');
    this.cartToggle = document.getElementById('cart-toggle');
    this.cartClose = document.getElementById('cart-close');
  }

  bindEvents() {
    // Eventos del carrito
    if (this.cartToggle) {
      this.cartToggle.addEventListener('click', () => this.openCart());
    }

    if (this.cartClose) {
      this.cartClose.addEventListener('click', () => this.closeCart());
    }

    if (this.cartOverlay) {
      this.cartOverlay.addEventListener('click', () => this.closeCart());
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeCart();
      }
    });

    // Eventos globales para agregar al carrito desde cualquier parte
    window.addEventListener('add-to-cart', (event) => {
      const { product, quantity, variant } = event.detail;
      this.addToCart(product, quantity, variant);
    });

    // Botón para limpiar carrito (debug)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        clearCart();
        console.log('🗑️ Carrito limpiado (Ctrl+Shift+C)');
      }
      
      // Agregar productos de prueba
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        addMockProducts();
        console.log('📦 Productos de prueba agregados (Ctrl+Shift+M)');
      }
    });
  }

  subscribeToStore() {
    // Suscribirse a cambios en el store
    cartStore.subscribe((cart) => {
      this.updateUI();
    });

    cartSummary.subscribe((summary) => {
      this.updateSummary(summary);
    });

    cartItemCount.subscribe((count) => {
      this.updateCounter(count);
    });
  }

  updateUI() {
    const cart = cartStore.get();
    this.renderCartItems(cart.items);
    this.updateCounter(cartItemCount.get());
    this.updateSummary(cartSummary.get());
  }

  updateCounter(count) {
    if (this.cartCounter) {
      this.cartCounter.textContent = count.toString();
      
      if (count > 0) {
        this.cartCounter.style.display = 'flex';
        this.cartCounter.classList.remove('hidden');
      } else {
        this.cartCounter.style.display = 'none';
        this.cartCounter.classList.add('hidden');
      }
    }
  }

  updateSummary(summary) {
    if (this.cartTotal) {
      this.cartTotal.textContent = `$${summary.total.toLocaleString('es-CO')}`;
    }
  }

  renderCartItems(items) {
    if (!this.cartItemsContainer) return;

    if (items.length === 0) {
      this.cartItemsContainer.innerHTML = `
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2-2" />
          </svg>
          <p class="mt-4 text-gray-500">Tu carrito está vacío</p>
          <button class="mt-4 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors" onclick="cartUI.closeCart()">
            Explorar Productos
          </button>
        </div>
      `;
      return;
    }

    this.cartItemsContainer.innerHTML = items.map(item => `
      <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
        <img 
          src="${item.image}" 
          alt="${item.name}"
          class="w-16 h-16 object-cover rounded-md"
          onerror="this.src='/images/placeholder-product.jpg'"
        />
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-gray-900 truncate">${item.name}</h3>
          <p class="text-sm text-gray-600">${item.category}</p>
          ${item.selectedVariant ? `
            <p class="text-xs text-gray-500">
              ${item.selectedVariant.color ? `Color: ${item.selectedVariant.color}` : ''}
              ${item.selectedVariant.size ? ` • Talla: ${item.selectedVariant.size}` : ''}
            </p>
          ` : ''}
          <div class="flex items-center mt-2">
            <button 
              onclick="cartUI.decreaseQuantity('${item.id}')"
              class="text-gray-400 hover:text-gray-600 p-1"
              ${item.quantity <= 1 ? 'disabled' : ''}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            <span class="mx-3 font-medium">${item.quantity}</span>
            <button 
              onclick="cartUI.increaseQuantity('${item.id}')"
              class="text-gray-400 hover:text-gray-600 p-1"
              ${item.quantity >= 10 ? 'disabled' : ''}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
        <div class="text-right">
          <p class="font-semibold text-gray-900">
            $${(item.price * item.quantity).toLocaleString('es-CO')}
          </p>
          ${item.originalPrice && item.originalPrice > item.price ? `
            <p class="text-sm text-gray-500 line-through">
              $${(item.originalPrice * item.quantity).toLocaleString('es-CO')}
            </p>
          ` : ''}
          <button 
            onclick="cartUI.removeItem('${item.id}')"
            class="text-red-500 hover:text-red-700 text-sm mt-1"
          >
            Eliminar
          </button>
        </div>
      </div>
    `).join('');
  }

  // Métodos públicos para interacción
  addToCart(product, quantity = 1, variant = null) {
    addToCart(product, quantity, variant);
    this.openCart(); // Abrir carrito al agregar producto
  }

  removeItem(itemId) {
    removeFromCart(itemId);
  }

  increaseQuantity(itemId) {
    const cart = cartStore.get();
    const item = cart.items.find(i => i.id === itemId);
    if (item && item.quantity < 10) {
      updateCartItemQuantity(itemId, item.quantity + 1);
    }
  }

  decreaseQuantity(itemId) {
    const cart = cartStore.get();
    const item = cart.items.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      updateCartItemQuantity(itemId, item.quantity - 1);
    }
  }

  openCart() {
    openCart();
    if (this.cartSidebar && this.cartOverlay) {
      this.cartSidebar.classList.remove('translate-x-full');
      this.cartOverlay.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }
  }

  closeCart() {
    closeCart();
    if (this.cartSidebar && this.cartOverlay) {
      this.cartSidebar.classList.add('translate-x-full');
      this.cartOverlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }

  clearCart() {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCart();
    }
  }
}

// ===========================================
// FUNCIONES GLOBALES PARA PRODUCTOS
// ===========================================

// Función global para agregar productos desde cualquier componente
window.addToCartGlobal = function(productData, quantity = 1, variant = null) {
  if (!productData || !productData.id) {
    console.error('❌ Datos de producto inválidos:', productData);
    return;
  }

  // Evento personalizado para agregar al carrito
  window.dispatchEvent(new CustomEvent('add-to-cart', {
    detail: { product: productData, quantity, variant }
  }));
};

// Función para simular agregar producto (para testing)
window.testAddToCart = function() {
  const testProduct = {
    id: "test-" + Date.now(),
    name: "Producto de Prueba",
    price: 99000,
    originalPrice: 129000,
    image: "/images/productos/test-product.jpg",
    category: "Pruebas"
  };
  
  window.addToCartGlobal(testProduct, 1);
  console.log('🧪 Producto de prueba agregado');
};

// ===========================================
// INTEGRACIÓN CON PRODUCT CARDS
// ===========================================

// Función para mejorar los botones "Agregar al Carrito" existentes
function enhanceAddToCartButtons() {
  const addToCartButtons = document.querySelectorAll('[data-product-id]');
  
  addToCartButtons.forEach(button => {
    // Evitar duplicar event listeners
    if (button.dataset.enhanced === 'true') return;
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const productId = this.dataset.productId;
      const productName = this.dataset.productName || 'Producto';
      const productPrice = parseInt(this.dataset.productPrice || '0');
      const productImage = this.dataset.productImage || '/images/placeholder-product.jpg';
      const productCategory = this.dataset.productCategory || 'General';
      
      if (!productId) {
        console.error('❌ Product ID no encontrado en el botón');
        return;
      }

      const product = {
        id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        category: productCategory
      };

      window.addToCartGlobal(product, 1);
    });
    
    button.dataset.enhanced = 'true';
  });
}

// ===========================================
// INICIALIZACIÓN GLOBAL
// ===========================================

// Crear instancia global del cart UI
let cartUI;

// Función de inicialización principal
function initializeCartSystem() {
  if (typeof window === 'undefined') return;
  
  // Crear instancia del CartUI
  cartUI = new CartUI();
  
  // Hacer disponible globalmente
  window.cartUI = cartUI;
  
  // Mejorar botones existentes
  enhanceAddToCartButtons();
  
  // Observer para nuevos botones que se agreguen dinámicamente
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        enhanceAddToCartButtons();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('🚀 Sistema de carrito completamente inicializado');
  
  // Mostrar ayuda de debug en consola
  console.log(`
🛒 COMANDOS DE DEBUG DEL CARRITO:
• Ctrl+Shift+C: Limpiar carrito
• Ctrl+Shift+M: Agregar productos de prueba
• testAddToCart(): Agregar producto de prueba
• cartUI.openCart(): Abrir carrito
• cartUI.closeCart(): Cerrar carrito
• cartUI.clearCart(): Limpiar carrito (con confirmación)
  `);
}

// Auto-inicializar cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCartSystem);
} else {
  initializeCartSystem();
}

// Exportar para uso en módulos
export { CartUI, initializeCartSystem, enhanceAddToCartButtons };