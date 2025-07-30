// src/scripts/cart.js - VERSIÓN CORREGIDA SIN DUPLICACIONES
console.log('🛒 Iniciando sistema de carrito...');

// ✅ CONSTANTES ÚNICAS
const CART_STORAGE_KEY = 'martek-cart';
const CART_EVENTS = {
  UPDATED: 'cart-updated',
  ITEM_ADDED: 'cart-item-added',
  ITEM_REMOVED: 'cart-item-removed',
  CLEARED: 'cart-cleared'
};

// ✅ FUNCIONES DE STORAGE
const CartStorage = {
  getItems() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      
      if (!Array.isArray(items)) return [];
      
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
      console.error('Error leyendo carrito:', error);
      return [];
    }
  },

  saveItems(items) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent(CART_EVENTS.UPDATED, {
        detail: { items }
      }));
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  }
};

// ✅ API PÚBLICA DEL CARRITO
window.Cart = {
  getItems: () => CartStorage.getItems(),
  
  addItem: (product, quantity = 1) => {
    try {
      const items = CartStorage.getItems();
      const existingIndex = items.findIndex(item => item.product_id === product.id);
      
      if (existingIndex >= 0) {
        items[existingIndex].quantity += quantity;
        items[existingIndex].updated_at = new Date().toISOString();
      } else {
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
      }
      
      CartStorage.saveItems(items);
      return true;
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      return false;
    }
  },
  
  removeItem: (productId) => {
    try {
      const items = CartStorage.getItems();
      const filteredItems = items.filter(item => item.product_id !== productId);
      CartStorage.saveItems(filteredItems);
      return true;
    } catch (error) {
      console.error('Error removiendo del carrito:', error);
      return false;
    }
  },
  
  updateQuantity: (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        return window.Cart.removeItem(productId);
      }
      
      const items = CartStorage.getItems();
      const itemIndex = items.findIndex(item => item.product_id === productId);
      
      if (itemIndex >= 0) {
        items[itemIndex].quantity = newQuantity;
        items[itemIndex].updated_at = new Date().toISOString();
        CartStorage.saveItems(items);
      }
      
      return true;
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      return false;
    }
  },
  
  getTotal: () => {
    const items = CartStorage.getItems();
    return items.reduce((total, item) => total + (item.product_price * item.quantity), 0);
  },
  
  getItemCount: () => {
    const items = CartStorage.getItems();
    return items.reduce((total, item) => total + item.quantity, 0);
  }
};

// ✅ ACTUALIZAR UI
function updateCartUI() {
  const itemCount = window.Cart.getItemCount();
  
  const cartBadges = document.querySelectorAll('.cart-badge, [data-cart-count]');
  cartBadges.forEach(badge => {
    if (badge) {
      badge.textContent = itemCount.toString();
      badge.style.display = itemCount > 0 ? 'block' : 'none';
    }
  });
  
  console.log('🔄 UI actualizada:', itemCount, 'items');
}

// ✅ INICIALIZACIÓN
window.addEventListener('load', () => {
  updateCartUI();
  console.log('✅ Sistema de carrito inicializado');
  
  if (window.Cart.getItemCount() === 0) {
    console.log('🛒 Carrito vacío');
  }
});

window.addEventListener(CART_EVENTS.UPDATED, updateCartUI);