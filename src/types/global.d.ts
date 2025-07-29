// ✅ src/types/global.d.ts - DECLARACIONES GLOBALES CORREGIDAS PARA TYPESCRIPT

// ✅ TIPOS PARA SUPABASE
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

type SupabaseClient = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
    signUp: (options: { email: string; password: string; options?: any }) => Promise<any>;
    signOut: () => Promise<any>;
    getUser: (jwt?: string) => Promise<{ data: { user: any }; error: any }>;
  };
  from: (table: string) => any;
};

// ✅ DECLARACIONES GLOBALES PARA WINDOW
declare global {
  interface Window {
    // Funciones del carrito
    addProductToCart: (
      productId: string, 
      productName: string, 
      productPrice: number, 
      productImage: string, 
      productCategory: string, 
      buttonElement?: Element | null
    ) => void;
    
    addToCart: (product: {
      id: string;
      name: string;
      price: number;
      image?: string;
      category?: string;
    }, quantity?: number) => void;
    
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getCartItems: () => any[];
    getCartTotal: () => number;
    getCartCount: () => number;
    
    // Funciones de autenticación
    loginUser: (email: string, password: string) => Promise<boolean>;
    logoutUser: () => void;
    getCurrentUser: () => any | null;
    
    // Funciones de productos
    searchProducts: (query: string) => void;
    filterByCategory: (category: string) => void;
  }
}

// Tipos específicos para el carrito
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  count: number;
}

// Tipos para autenticación
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