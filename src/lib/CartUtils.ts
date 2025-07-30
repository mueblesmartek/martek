// src/lib/CartUtils.ts - IMPLEMENTACIÓN LIMPIA (sin conflictos de tipos)

// ✅ IMPORTAR TIPOS DESDE EL ARCHIVO MAESTRO
import type { 
  CartItem, 
  CartTotals, 
  CartManagerInterface, 
  PriceUtilsInterface,
  CartNotificationOptions,
  CartEventDetail
} from './CartTypes';
import { CART_CONFIG, isValidCartItem } from './CartTypes';

// ✅ UTILIDADES DE PRECIO
export class PriceUtils implements PriceUtilsInterface {
  static validate(price: any): number {
    if (typeof price === 'number' && !isNaN(price) && price >= 0) {
      return price;
    }
    
    if (typeof price === 'string') {
      const cleanPrice = price.replace(/[^\d.,]/g, '').replace(',', '.');
      const numPrice = parseFloat(cleanPrice);
      return !isNaN(numPrice) && numPrice >= 0 ? numPrice : 0;
    }
    
    return 0;
  }

  static format(price: number): string {
    try {
      const validPrice = this.validate(price);
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(validPrice);
    } catch (error) {
      return `$${this.validate(price).toLocaleString('es-CO')}`;
    }
  }

  static calculateItemTotal(price: number, quantity: number): number {
    const validPrice = this.validate(price);
    const validQuantity = typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : 1;
    return validPrice * validQuantity;
  }

  static calculateCartTotals(items: CartItem[]): CartTotals {
    const subtotal = items.reduce((sum, item) => {
      return sum + this.calculateItemTotal(item.product_price, item.quantity);
    }, 0);

    const totalItems = items.reduce((sum, item) => {
      return sum + (typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1);
    }, 0);

    const shipping = subtotal >= CART_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CART_CONFIG.SHIPPING_COST;
    const tax = Math.round(subtotal * CART_CONFIG.TAX_RATE);
    const total = subtotal + shipping + tax;

    return { items: totalItems, subtotal, shipping, tax, total };
  }

  // Implementar interface methods
  validate = PriceUtils.validate;
  format = PriceUtils.format;
  calculateItemTotal = PriceUtils.calculateItemTotal;
  calculateCartTotals = PriceUtils.calculateCartTotals;
}

// ✅ VALIDADOR DE ITEMS
export class CartValidator {
  static validate(item: any): CartItem | null {
    try {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const product_id = item.product_id || item.id;
      const product_name = item.product_name || item.name;

      if (!product_id || !product_name) {
        return null;
      }

      const validItem: CartItem = {
        id: item.id || `temp_${Date.now()}`,
        product_id: product_id.toString(),
        user_id: item.user_id || null,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? Math.floor(item.quantity) : 1,
        product_name: product_name.toString().trim(),
        product_price: PriceUtils.validate(item.product_price || item.price),
        product_image: item.product_image || item.image || null,
        product_category: item.product_category || item.category || '',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return validItem;
    } catch (error) {
      console.error('Error validando item:', error);
      return null;
    }
  }

  static validateArray(items: any[]): CartItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map(item => this.validate(item))
      .filter((item): item is CartItem => item !== null);
  }
}

// ✅ NOTIFICACIONES DEL CARRITO
export class CartNotifications {
  static show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = CART_CONFIG.NOTIFICATION_DURATION): void {
    try {
      const notification = document.createElement('div');
      notification.className = `
        fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-all duration-300 transform translate-x-full opacity-0
        ${type === 'success' ? 'bg-green-600 text-white' :
          type === 'error' ? 'bg-red-600 text-white' :
          type === 'warning' ? 'bg-yellow-600 text-white' :
          'bg-blue-600 text-white'}
      `;

      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="flex-1">${message}</span>
          <button onclick="this.parentElement.parentElement.remove()" 
                  class="text-white hover:text-gray-200 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
      }, 100);

      setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, duration);

    } catch (error) {
      console.error('Error mostrando notificación:', error);
      alert(message);
    }
  }
}

// ✅ GESTOR PRINCIPAL DEL CARRITO
export class CartManager implements CartManagerInterface {
  private static instance: CartManager;
  private items: CartItem[] = [];
  private totals: CartTotals = { items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };

  constructor() {
    this.loadFromStorage();
  }

  static getInstance(): CartManager {
    if (!CartManager.instance) {
      CartManager.instance = new CartManager();
    }
    return CartManager.instance;
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;

      const stored = localStorage.getItem(CART_CONFIG.STORAGE_KEY);
      const rawItems = stored ? JSON.parse(stored) : [];
      
      this.items = CartValidator.validateArray(rawItems);
      this.totals = PriceUtils.calculateCartTotals(this.items);
      
      console.log('✅ Carrito cargado:', this.items.length, 'items');
    } catch (error) {
      console.error('Error cargando carrito:', error);
      this.items = [];
      this.totals = { items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(CART_CONFIG.STORAGE_KEY, JSON.stringify(this.items));
      this.dispatchEvent(CART_CONFIG.EVENTS.UPDATED, { items: this.items, totals: this.totals });
      
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  }

  private dispatchEvent(eventName: string, detail: CartEventDetail): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  // ✅ IMPLEMENTAR INTERFACE CartManagerInterface
  getItems(): CartItem[] {
    return [...this.items];
  }

  addItem(productId: string, productName: string, productPrice: number, quantity = 1, productImage?: string, productCategory?: string): boolean {
    try {
      const existingIndex = this.items.findIndex(item => item.product_id === productId);
      
      if (existingIndex !== -1) {
        this.items[existingIndex].quantity += quantity;
        this.items[existingIndex].updated_at = new Date().toISOString();
      } else {
        const newItem: CartItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          product_id: productId,
          user_id: null,
          quantity: quantity,
          product_name: productName,
          product_price: PriceUtils.validate(productPrice),
          product_image: productImage || null,
          product_category: productCategory || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        this.items.push(newItem);
      }

      this.totals = PriceUtils.calculateCartTotals(this.items);
      this.saveToStorage();
      this.dispatchEvent(CART_CONFIG.EVENTS.ITEM_ADDED, { item: this.items[existingIndex] || this.items[this.items.length - 1] });
      
      return true;
    } catch (error) {
      console.error('Error agregando item:', error);
      return false;
    }
  }

  updateItemQuantity(itemId: string, quantity: number): boolean {
    try {
      const index = this.items.findIndex(item => item.id === itemId);
      
      if (index === -1) return false;
      
      if (quantity <= 0) {
        return this.removeItem(itemId);
      }
      
      this.items[index].quantity = Math.floor(quantity);
      this.items[index].updated_at = new Date().toISOString();
      
      this.totals = PriceUtils.calculateCartTotals(this.items);
      this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      return false;
    }
  }

  removeItem(itemId: string): boolean {
    try {
      const index = this.items.findIndex(item => item.id === itemId);
      
      if (index === -1) return false;
      
      const removedItem = this.items[index];
      this.items.splice(index, 1);
      
      this.totals = PriceUtils.calculateCartTotals(this.items);
      this.saveToStorage();
      this.dispatchEvent(CART_CONFIG.EVENTS.ITEM_REMOVED, { item: removedItem });
      
      return true;
    } catch (error) {
      console.error('Error removiendo item:', error);
      return false;
    }
  }

  clearCart(): void {
    this.items = [];
    this.totals = { items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };
    this.saveToStorage();
    this.dispatchEvent(CART_CONFIG.EVENTS.CLEARED, { items: [] });
  }

  getTotals(): CartTotals {
    return { ...this.totals };
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getCheckoutSummary() {
    return {
      items: this.getItems(),
      totals: this.getTotals(),
      itemCount: this.totals.items,
      isEmpty: this.isEmpty()
    };
  }
}

// ✅ INICIALIZACIÓN AUTOMÁTICA (SIN DECLARACIONES GLOBALES)
if (typeof window !== 'undefined') {
  const cartManager = CartManager.getInstance();
  const priceUtils = new PriceUtils();

  // Asignar a Window (los tipos ya están declarados en CartTypes.ts)
  window.CartManager = cartManager;
  window.PriceUtils = priceUtils;

  // Funciones de conveniencia
  window.addToCart = (productId, productName, productPrice, quantity = 1) => {
    const success = cartManager.addItem(productId, productName, productPrice, quantity);
    if (success) {
      CartNotifications.show(`${productName} agregado al carrito`, 'success');
    } else {
      CartNotifications.show('Error agregando producto', 'error');
    }
    return success;
  };

  window.updateItemQuantity = (itemId, quantity) => {
    return cartManager.updateItemQuantity(itemId, quantity);
  };

  window.removeItem = (itemId) => {
    const success = cartManager.removeItem(itemId);
    if (success) {
      CartNotifications.show('Producto eliminado', 'info');
    }
    return success;
  };

  window.clearCart = () => {
    cartManager.clearCart();
    CartNotifications.show('Carrito vaciado', 'info');
  };

  window.getCartTotals = () => cartManager.getTotals();
  window.getCartItems = () => cartManager.getItems();

  console.log('✅ CartUtils inicializado globalmente');
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const cartManager = typeof window !== 'undefined' ? CartManager.getInstance() : null;
export default CartManager;