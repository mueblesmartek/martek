// public/js/cart.js - SISTEMA DE CARRITO PARA PÁGINAS ASTRO
console.log('🛒 Iniciando sistema de carrito (Astro)...');

// ✅ CONSTANTES
const CART_STORAGE_KEY = 'martek-cart';
const CART_EVENTS = {
  UPDATED: 'cart-updated',
  ITEM_ADDED: 'cart-item-added',
  ITEM_REMOVED: 'cart-item-removed',
  CLEARED: 'cart-cleared'
};

// ✅ UTILIDADES DE STORAGE
const CartStorage = {
  getItems: function() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading cart:', error);
      return [];
    }
  },

  setItems: function(items) {
    try {
      const validItems = Array.isArray(items) ? items : [];
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
      
      // Disparar eventos
      window.dispatchEvent(new CustomEvent(CART_EVENTS.UPDATED, { 
        detail: { items: validItems } 
      }));
      
      // Actualizar UI
      updateCartDisplay();
      
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  },

  getTotalItems: function() {
    return this.getItems().reduce(function(total, item) {
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      return total + quantity;
    }, 0);
  },

  getTotalPrice: function() {
    return this.getItems().reduce(function(total, item) {
      const price = typeof item.product_price === 'number' && !isNaN(item.product_price) ? item.product_price : 0;
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      return total + (price * quantity);
    }, 0);
  },

  formatPrice: function(price) {
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
      return '$' + (price || 0).toLocaleString();
    }
  }
};

// ✅ FUNCIÓN PRINCIPAL: AGREGAR AL CARRITO
window.addToCart = function(id, name, price, quantity) {
  console.log('➕ addToCart:', { id, name, price, quantity });
  
  try {
    // Validar parámetros
    if (!id || !name || typeof price !== 'number' || isNaN(price)) {
      console.error('❌ Parámetros inválidos:', { id, name, price });
      showNotification('Error: datos de producto inválidos', 'error');
      return;
    }
    
    const validPrice = price > 0 ? price : 0;
    const validQuantity = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    
    // Obtener carrito actual
    const cartItems = CartStorage.getItems();
    
    // Buscar si ya existe
    const existingIndex = cartItems.findIndex(function(item) {
      return item.product_id === id;
    });
    
    if (existingIndex >= 0) {
      // Actualizar cantidad
      cartItems[existingIndex].quantity += validQuantity;
      cartItems[existingIndex].updated_at = new Date().toISOString();
      console.log('📦 Cantidad actualizada:', cartItems[existingIndex]);
    } else {
      // Crear nuevo item
      const newItem = {
        id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        product_id: id,
        user_id: null,
        quantity: validQuantity,
        product_name: name,
        product_price: validPrice,
        product_image: null,
        product_category: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      cartItems.push(newItem);
      console.log('➕ Nuevo item creado:', newItem);
    }
    
    // Guardar en localStorage
    CartStorage.setItems(cartItems);
    
    // Disparar evento específico
    window.dispatchEvent(new CustomEvent(CART_EVENTS.ITEM_ADDED, {
      detail: { product: { id: id, name: name, price: validPrice }, quantity: validQuantity }
    }));
    
    // Mostrar notificación
    showNotification(name + ' agregado al carrito', 'success');
    
    console.log('✅ Producto agregado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en addToCart:', error);
    showNotification('Error agregando producto', 'error');
  }
};

// ✅ FUNCIÓN ESPECÍFICA PARA PRODUCTOS CON IMAGEN
window.addProductToCart = function(id, name, price, image, category, buttonElement) {
  console.log('➕ addProductToCart:', { id, name, price });
  
  // Prevenir múltiples clicks
  if (buttonElement && buttonElement.disabled) return;
  
  // Feedback visual inmediato
  var originalText = '';
  var originalClass = '';
  
  if (buttonElement) {
    originalText = buttonElement.textContent || '';
    originalClass = buttonElement.className;
    
    buttonElement.disabled = true;
    buttonElement.textContent = 'Agregando...';
    buttonElement.className = buttonElement.className.replace('bg-gray-900', 'bg-gray-400');
  }
  
  try {
    // Validar precio
    const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
    
    // Obtener carrito
    const cartItems = CartStorage.getItems();
    
    // Buscar existente
    const existingIndex = cartItems.findIndex(function(item) {
      return item.product_id === id;
    });
    
    if (existingIndex >= 0) {
      // Actualizar
      cartItems[existingIndex].quantity += 1;
      cartItems[existingIndex].updated_at = new Date().toISOString();
    } else {
      // Crear nuevo con todos los datos
      const newItem = {
        id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        product_id: id,
        user_id: null,
        quantity: 1,
        product_name: name,
        product_price: validPrice,
        product_image: image || null,
        product_category: category || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      cartItems.push(newItem);
    }
    
    // Guardar
    CartStorage.setItems(cartItems);
    
    // Feedback de éxito
    if (buttonElement) {
      buttonElement.textContent = '¡Agregado!';
      buttonElement.className = originalClass.replace(/bg-gray-\d+/, 'bg-green-600');
      
      // Restaurar después de 1.5s
      setTimeout(function() {
        buttonElement.textContent = originalText;
        buttonElement.className = originalClass;
        buttonElement.disabled = false;
      }, 1500);
    }
    
    // Notificación
    showNotification(name + ' agregado al carrito', 'success');
    
  } catch (error) {
    console.error('Error en addProductToCart:', error);
    showNotification('Error agregando producto', 'error');
    
    // Restaurar botón en caso de error
    if (buttonElement) {
      buttonElement.textContent = originalText;
      buttonElement.className = originalClass;
      buttonElement.disabled = false;
    }
  }
};

// ✅ OTRAS FUNCIONES DE CARRITO
window.updateItemQuantity = function(itemId, quantity) {
  try {
    const cartItems = CartStorage.getItems();
    const updatedItems = cartItems.map(function(item) {
      if (item.id === itemId) {
        return Object.assign({}, item, {
          quantity: quantity,
          updated_at: new Date().toISOString()
        });
      }
      return item;
    });
    
    CartStorage.setItems(updatedItems);
    showNotification('Cantidad actualizada', 'info');
    
  } catch (error) {
    console.error('Error updating quantity:', error);
  }
};

window.removeItem = function(itemId) {
  try {
    const cartItems = CartStorage.getItems();
    const filteredItems = cartItems.filter(function(item) {
      return item.id !== itemId;
    });
    
    CartStorage.setItems(filteredItems);
    showNotification('Producto removido', 'info');
    
  } catch (error) {
    console.error('Error removing item:', error);
  }
};

window.clearCart = function() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartDisplay();
    
    window.dispatchEvent(new CustomEvent(CART_EVENTS.CLEARED));
    showNotification('Carrito vaciado', 'info');
    
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

// ✅ FUNCIÓN PARA ACTUALIZAR CONTADORES EN LA UI
function updateCartDisplay() {
  try {
    const totalItems = CartStorage.getTotalItems();
    
    // Actualizar contadores
    const counters = document.querySelectorAll('[data-cart-counter]');
    counters.forEach(function(counter) {
      counter.textContent = totalItems.toString();
      if (totalItems > 0) {
        counter.classList.remove('hidden');
        counter.classList.add('flex');
      } else {
        counter.classList.add('hidden');
        counter.classList.remove('flex');
      }
    });
    
    // Actualizar badges
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(function(badge) {
      if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
    
    console.log('🔄 UI actualizada:', totalItems, 'items');
    
  } catch (error) {
    console.error('Error updating cart display:', error);
  }
}

// ✅ SISTEMA DE NOTIFICACIONES
function showNotification(message, type) {
  type = type || 'success';
  
  // Remover notificaciones existentes
  const existing = document.querySelectorAll('.cart-notification');
  existing.forEach(function(n) { n.remove(); });
  
  // Crear nueva notificación
  const notification = document.createElement('div');
  notification.className = 'cart-notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300';
  
  // Colores según tipo
  if (type === 'success') {
    notification.className += ' bg-green-50 border-green-200 text-green-800';
  } else if (type === 'error') {
    notification.className += ' bg-red-50 border-red-200 text-red-800';
  } else {
    notification.className += ' bg-blue-50 border-blue-200 text-blue-800';
  }
  
  // Contenido
  notification.innerHTML = 
    '<div class="flex items-center justify-between">' +
      '<span class="text-sm font-medium">' + message + '</span>' +
      '<button onclick="this.parentElement.parentElement.remove()" class="ml-3 opacity-50 hover:opacity-100">' +
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' +
        '</svg>' +
      '</button>' +
    '</div>';
  
  // Mostrar
  document.body.appendChild(notification);
  
  // Auto-remover después de 3 segundos
  setTimeout(function() {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// ✅ EXPONER UTILIDADES GLOBALMENTE
window.CartUtils = CartStorage;
window.CART_EVENTS = CART_EVENTS;

// ✅ INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Sistema de carrito inicializado');
  updateCartDisplay();
  
  // Escuchar cambios de storage (múltiples pestañas)
  window.addEventListener('storage', function(e) {
    if (e.key === CART_STORAGE_KEY) {
      updateCartDisplay();
    }
  });
  
  // Log inicial
  const items = CartStorage.getItems();
  if (items.length > 0) {
    console.log('🛒 Carrito cargado:', items.length, 'items, total:', CartStorage.formatPrice(CartStorage.getTotalPrice()));
  } else {
    console.log('🛒 Carrito vacío');
  }
});

console.log('🛒 Cart.js cargado - Funciones disponibles: addToCart, addProductToCart, updateItemQuantity, removeItem, clearCart');