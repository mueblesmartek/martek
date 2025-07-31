// ✅ src/types/global.d.ts - DECLARACIONES GLOBALES CORREGIDAS PARA TYPESCRIPT

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
  created_at: string;
  [key: string]: any;
} | null;

declare global {
  interface WindowEventMap {
    'cart-ready': CustomEvent<{
      timestamp: number;
      cartAPI: boolean;
      addToCart: boolean;
      cartManager: boolean;
    }>;
    'cart-error': CustomEvent<{
      error: string;
      timestamp?: number;
    }>;
    'cart-updated': CustomEvent<{
      items: any[];
      totals: any;
    }>;
    'cart-item-added': CustomEvent<{
      item: any;
    }>;
    'cart-system-ready': CustomEvent<any>;
    'martek-cart-ready': CustomEvent<any>;
  }

  interface Window {
    // Funciones de carrito existentes
    addToCart: (productId: string, productName: string, productPrice: number, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartCounter: () => void;
    clearCart: () => void;
    getCartItems: () => any[];
    getCartTotal: () => number;
    CartAPI?: any;
    CartManager?: any;
    
    // Funciones helper
    waitForCart?: (timeout?: number) => Promise<boolean>;
    safeAddToCart?: (productId: string, productName: string, productPrice: number, quantity?: number) => Promise<boolean>;
    
    // Flags del sistema
    MARTEK_EVENT_SYSTEM_LOADED?: boolean;
    
    // Funciones de autenticación y otros
    loginUser: (email: string, password: string) => Promise<boolean>;
    logoutUser: () => void;
    getCurrentUser: () => any | null;
    searchProducts: (query: string) => void;
    filterByCategory: (category: string) => void;
  }
}

export {};

type SupabaseClient = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
    signUp: (options: { email: string; password: string; options?: any }) => Promise<any>;
    signOut: () => Promise<any>;
    getUser: (jwt?: string) => Promise<{ data: { user: any }; error: any }>;
  };
  from: (table: string) => any;
};

// ✅ DECLARACIONES GLOBALES (SOLO NO-CARRITO)
declare global {
  interface Window {
    // Funciones de autenticación
    loginUser: (email: string, password: string) => Promise<boolean>;
    logoutUser: () => void;
    getCurrentUser: () => any | null;
    
    // Funciones de productos y búsqueda
    searchProducts: (query: string) => void;
    filterByCategory: (category: string) => void;
    
    // Función legacy (mantener por compatibilidad)
    addProductToCart?: (
      productId: string, 
      productName: string, 
      productPrice: number, 
      productImage: string, 
      productCategory: string, 
      buttonElement?: Element | null
    ) => void;
  }
}

// ✅ TIPOS PARA AUTENTICACIÓN (no relacionados con carrito)
export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export {};