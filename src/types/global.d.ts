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