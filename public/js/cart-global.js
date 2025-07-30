// public/js/cart-global.js - SCRIPT ÚNICO PARA TODA LA APP mueblesmartek.com
(function() {
  'use strict';
  
  // 🔑 CONSTANTES
  const CART_KEY = 'martek-cart';
  const EVENTS = {
    UPDATED: 'cart:updated',
    ADDED: 'cart:added', 
    REMOVED: 'cart:removed',
    CLEARED: 'cart:cleared'
  };

  // 🛡️ VALIDACIÓN ROBUSTA DE ITEMS DEL CARRITO
  function validateItem(item) {
    return item && 
           typeof item === 'object' &&
           item.id && 
           item.product_id &&
           item.product_name &&
           typeof item.product_price === 'number' &&
           item.product_price >= 0 &&
           typeof item.quantity === 'number' &&
           item.quantity > 0;
  }

  // 🔧 GENERAR ID ÚNICO PARA ITEMS DEL CARRITO
  function generateItemId() {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 📦 CART API GLOBAL - FUENTE ÚNICA DE VERDAD
  window.CartAPI = {
    
    // ✅ OBTENER TODOS LOS ITEMS DEL CARRITO
    getItems() {
      try {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          return [];
        }
        
        const stored = localStorage.getItem(CART_KEY);
        if (!stored) return [];
        
        const items = JSON.parse(stored);
        if (!Array.isArray(items)) return [];
        
        // Filtrar solo items válidos y limpiar corruptos
        const validItems = items.filter(validateItem);
        
        // Si encontramos items corruptos, actualizar localStorage
        if (validItems.length !== items.length) {
          console.warn(`🧹 Limpiando ${items.length - validItems.length} items corruptos del carrito`);
          this.saveItems(validItems, false); // false = no emitir evento para evitar loop
        }
        
        return validItems;
      } catch (error) {
        console.error('❌ Error leyendo carrito:', error);
        return [];
      }
    },

    // ✅ GUARDAR ITEMS EN LOCALSTORAGE Y EMITIR EVENTOS
    saveItems(items, shouldEmit = true) {
      try {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          return;
        }
        
        const validItems = items.filter(validateItem);
        localStorage.setItem(CART_KEY, JSON.stringify(validItems));
        
        // Actualizar contadores en la UI
        this.updateCounters();
        
        // Emitir evento solo si se solicita
        if (shouldEmit) {
          this.emit(EVENTS.UPDATED, validItems);
        }
        
        console.log(`💾 Carrito guardado: ${validItems.length} items`);
      } catch (error) {
        console.error('❌ Error guardando carrito:', error);
      }
    },

    // ✅ AGREGAR PRODUCTO AL CARRITO
    addProduct(productData) {
      try {
        // Validar datos del producto
        if (!productData || !productData.product_id || !productData.product_name) {
          throw new Error('Datos del producto inválidos');
        }
        
        if (typeof productData.product_price !== 'number' || productData.product_price < 0) {
          throw new Error('Precio del producto inválido');
        }
        
        const quantity = Math.max(1, parseInt(productData.quantity) || 1);
        const items = this.getItems();
        
        // Buscar si el producto ya existe en el carrito
        const existingIndex = items.findIndex(item => 
          item.product_id === productData.product_id
        );

        if (existingIndex >= 0) {
          // Actualizar cantidad del producto existente
          items[existingIndex].quantity += quantity;
          console.log(`➕ Cantidad actualizada: ${productData.product_name} (${items[existingIndex].quantity})`);
        } else {
          // Agregar nuevo producto al carrito
          const standardCartItem = {
  id: `temp_${Date.now()}`,
  product_id: productId,
  user_id: null,
  quantity: quantity,
  product_name: productName,     // ✅ Usar product_name
  product_price: productPrice,   // ✅ Usar product_price
  product_image: productImage,
  product_category: productCategory,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
          
          items.push(standardCartItem);
          console.log(`🆕 Nuevo producto agregado: ${productData.product_name}`);
        }

        this.saveItems(items);
        this.emit(EVENTS.ADDED, productData);
        
        // Mostrar notificación de éxito
        this.showNotification(`${productData.product_name} agregado al carrito`, 'success');
        
      } catch (error) {
        console.error('❌ Error agregando producto:', error);
        this.showNotification('Error agregando producto al carrito', 'error');
      }
    },

    // ✅ ACTUALIZAR CANTIDAD DE UN ITEM
    updateQuantity(itemId, quantity) {
      try {
        const newQuantity = parseInt(quantity);
        
        if (newQuantity <= 0) {
          this.removeItem(itemId);
          return;
        }

        const items = this.getItems();
        const itemIndex = items.findIndex(item => item.id === itemId);
        
        if (itemIndex >= 0) {
          const oldQuantity = items[itemIndex].quantity;
          items[itemIndex].quantity = newQuantity;
          items[itemIndex].updated_at = new Date().toISOString();
          
          this.saveItems(items);
          console.log(`🔄 Cantidad actualizada: ${items[itemIndex].product_name} (${oldQuantity} → ${newQuantity})`);
        }
      } catch (error) {
        console.error('❌ Error actualizando cantidad:', error);
      }
    },

    // ✅ REMOVER ITEM DEL CARRITO
    removeItem(itemId) {
      try {
        const items = this.getItems();
        const itemToRemove = items.find(item => item.id === itemId);
        
        if (itemToRemove) {
          const filteredItems = items.filter(item => item.id !== itemId);
          this.saveItems(filteredItems);
          this.emit(EVENTS.REMOVED, itemId);
          
          console.log(`🗑️ Item removido: ${itemToRemove.product_name}`);
          this.showNotification(`${itemToRemove.product_name} removido del carrito`, 'info');
        }
      } catch (error) {
        console.error('❌ Error removiendo item:', error);
      }
    },

    // ✅ LIMPIAR TODO EL CARRITO
    clear() {
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(CART_KEY);
        }
        
        this.updateCounters();
        this.emit(EVENTS.CLEARED);
        
        console.log('🧹 Carrito limpiado');
        this.showNotification('Carrito vaciado', 'info');
      } catch (error) {
        console.error('❌ Error limpiando carrito:', error);
      }
    },

    // ✅ CALCULAR TOTAL DE ITEMS
    getTotalItems() {
      return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    // ✅ CALCULAR PRECIO TOTAL
    getTotalPrice() {
      return this.getItems().reduce((sum, item) => 
        sum + (item.product_price * item.quantity), 0
      );
    },

    // ✅ FORMATEAR PRECIO EN PESOS COLOMBIANOS
    formatPrice(price) {
      try {
        const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(validPrice);
      } catch (error) {
        console.error('❌ Error formateando precio:', error);
        return `$${price || 0}`;
      }
    },

    // ✅ SISTEMA DE EVENTOS PARA COMUNICACIÓN ENTRE COMPONENTS
    emit(eventName, data) {
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(eventName, { 
            detail: data,
            bubbles: true,
            cancelable: true
          }));
        }
      } catch (error) {
        console.error('❌ Error emitiendo evento:', error);
      }
    },

    on(eventName, callback) {
      if (typeof window !== 'undefined') {
        window.addEventListener(eventName, callback);
      }
    },

    off(eventName, callback) {
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, callback);
      }
    },

    // ✅ ACTUALIZAR CONTADORES EN LA UI
    updateCounters() {
      try {
        const totalItems = this.getTotalItems();
        
        // Actualizar todos los contadores en la página
        document.querySelectorAll('[data-cart-counter]').forEach(counter => {
          counter.textContent = totalItems.toString();
          
          if (totalItems > 0) {
            counter.style.display = 'flex';
            counter.classList.remove('hidden');
          } else {
            counter.style.display = 'none';
            counter.classList.add('hidden');
          }
        });
        
        // Actualizar textos de total si existen
        document.querySelectorAll('[data-cart-total]').forEach(total => {
          total.textContent = this.formatPrice(this.getTotalPrice());
        });
        
      } catch (error) {
        console.error('❌ Error actualizando contadores:', error);
      }
    },

    // ✅ SISTEMA DE NOTIFICACIONES SIMPLE
    showNotification(message, type = 'info') {
      try {
        // Crear notificación simple
        const notification = document.createElement('div');
        notification.className = `
          fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300
          ${type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
          ${type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
          ${type === 'info' ? 'bg-gray-50 border border-gray-200 text-gray-800' : ''}
        `;
        
        notification.innerHTML = `
          <div class="flex items-center">
            <span class="mr-2">
              ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
          </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
        // Fallback a console.log
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    }
  };

  // 🚀 FUNCIONES GLOBALES PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
  window.addToCart = function(productId, name, price, quantity = 1, image = '', category = '') {
    window.CartAPI.addProduct({
      product_id: productId,
      product_name: name,
      product_price: price,
      quantity: quantity,
      product_image: image,
      product_category: category
    });
  };

  // 🎬 INICIALIZACIÓN AL CARGAR LA PÁGINA
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
  } else {
    initializeCart();
  }

  function initializeCart() {
    try {
      // Actualizar contadores iniciales
      window.CartAPI.updateCounters();
      
      // Log inicial
      const items = window.CartAPI.getItems();
      const totalItems = window.CartAPI.getTotalItems();
      const totalPrice = window.CartAPI.getTotalPrice();
      
      console.log(`🛒 CartAPI inicializado`);
      console.log(`📦 Items en carrito: ${totalItems}`);
      console.log(`💰 Total: ${window.CartAPI.formatPrice(totalPrice)}`);
      
      // Agregar listeners a botones existentes
      setupCartButtons();
      
    } catch (error) {
      console.error('❌ Error inicializando carrito:', error);
    }
  }

  // 🔘 CONFIGURAR BOTONES DEL CARRITO
  function setupCartButtons() {
    // Botones de "Agregar al carrito" genéricos
    document.querySelectorAll('[data-add-to-cart]').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const productId = this.dataset.productId;
        const productName = this.dataset.productName;
        const productPrice = parseFloat(this.dataset.productPrice);
        const productImage = this.dataset.productImage || '';
        const productCategory = this.dataset.productCategory || '';
        
        if (productId && productName && !isNaN(productPrice)) {
          window.CartAPI.addProduct({
            product_id: productId,
            product_name: productName,
            product_price: productPrice,
            product_image: productImage,
            product_category: productCategory,
            quantity: 1
          });
        }
      });
    });
    
    // Botón de limpiar carrito
    document.querySelectorAll('[data-clear-cart]').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
          window.CartAPI.clear();
        }
      });
    });
  }

})();