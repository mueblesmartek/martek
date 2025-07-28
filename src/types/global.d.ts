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
    // ✅ FUNCIONES BÁSICAS DEL CARRITO (de cart.js)
    addToCart: (id: string, name: string, price: number, quantity?: number) => void;
    addProductToCart: (id: string, name: string, price: number, image: string, category: string, buttonElement?: HTMLElement) => void;
    updateItemQuantity: (itemId: string, quantity: number) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    
    // ✅ FUNCIONES DE CARRITO AVANZADAS (para compatibilidad con React)
    openCart?: () => void;
    closeCart?: () => void; 
    toggleCart?: () => void;
    
    // ✅ OTRAS FUNCIONES
    selectImage?: (url: string, alt: string, index: number) => void;
    
    // File System API para artifacts
    fs?: {
      readFile: (filename: string, options?: { encoding?: string }) => Promise<string | Uint8Array>;
    };
    
    // ✅ UTILIDADES DEL CARRITO
    CartUtils: {
      getItems: () => any[];
      setItems: (items: any[]) => void;
      getTotalItems: () => number;
      getTotalPrice: () => number;
      formatPrice: (price: number) => string;
    };
    
    // ✅ EVENTOS DEL CARRITO
    CART_EVENTS: {
      UPDATED: string;
      ITEM_ADDED: string;
      ITEM_REMOVED: string;
      CLEARED: string;
    };
    
    // Google Analytics
    gtag?: (...args: any[]) => void;
    
    // Funciones de notificación
    showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
    
    // Supabase client
    supabase?: SupabaseClient;
    createClient?: (url: string, key: string) => SupabaseClient;
  }

  // ✅ DECLARACIONES PARA EVENTOS CUSTOM
  interface WindowEventMap {
    'cart-updated': CustomEvent<{ items: any[] }>;
    'cart-item-added': CustomEvent<{ product: any; quantity: number }>;
    'cart-item-removed': CustomEvent<{ itemId: string }>;
    'cart-cleared': CustomEvent;
    'cartUpdated': CustomEvent<import('../lib/types').CartItem[]>;
    'productUpdated': CustomEvent<import('../lib/types').Product>;
  }

  // ✅ DECLARACIONES PARA ELEMENTOS HTML
  interface HTMLElement {
    dataset: DOMStringMap;
  }

  interface HTMLImageElement {
    dataset: DOMStringMap;
  }

  interface HTMLButtonElement {
    dataset: DOMStringMap;
  }

  interface HTMLAnchorElement {
    dataset: DOMStringMap;
  }
  


// ✅ ASTRO LOCALS - CORREGIDO PARA MIDDLEWARE.TS
declare namespace App {
  interface Locals {
    user?: SupabaseUser;
  }
}

// ✅ VARIABLES DE ENTORNO
declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    WOMPI_PUBLIC_KEY: string;
    WOMPI_PRIVATE_KEY: string;
    WOMPI_ENVIRONMENT: 'test' | 'production';
  }
}

// ✅ TIPOS PARA WOMPI PAYMENTS
declare namespace Wompi {
  interface PaymentData {
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    payment_method: {
      type: string;
      installments?: number;
    };
    reference: string;
    customer_data?: {
      phone_number?: string;
      full_name?: string;
    };
    shipping_address?: {
      full_name: string;
      phone: string;
      address_line_1: string;
      address_line_2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  }
  
  interface PaymentResponse {
    status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';
    transaction_id?: string;
    reference?: string;
    message?: string;
  }
}

// ✅ ASTRO CONTENT COLLECTIONS
declare module 'astro:content' {
  interface ContentEntryMap {
    // Define aquí tus colecciones de contenido si las usas
  }
}

// ✅ DECLARACIONES PARA IMPORTACIÓN DE ARCHIVOS
declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// ✅ DECLARACIONES PARA EVENTOS CUSTOM
  interface WindowEventMap {
    'cart-updated': CustomEvent<{ items: any[] }>;
    'cart-item-added': CustomEvent<{ product: any; quantity: number }>;
    'cart-item-removed': CustomEvent<{ itemId: string }>;
    'cart-cleared': CustomEvent;
    'cartUpdated': CustomEvent<import('../lib/types').CartItem[]>;
    'productUpdated': CustomEvent<import('../lib/types').Product>;
    // ✅ EVENTOS DE CARRITO UI
    'cart-open': CustomEvent;
    'cart-close': CustomEvent;
    'cart-toggle': CustomEvent;
  }
// ✅ DECLARACIONES PARA ELEMENTOS HTML
  interface HTMLElement {
    dataset: DOMStringMap;
  }

  interface HTMLImageElement {
    dataset: DOMStringMap;
  }

  interface HTMLButtonElement {
    dataset: DOMStringMap;
  }

  interface HTMLAnchorElement {
    dataset: DOMStringMap;
  }
  
  // ✅ HACER SupabaseUser DISPONIBLE GLOBALMENTE
  var SupabaseUser: SupabaseUser;
}

// ✅ ASTRO LOCALS
declare namespace App {
  interface Locals {
    user?: SupabaseUser | null;
  }
}

// ✅ EXPORT VACÍO PARA HACER ESTE ARCHIVO UN MÓDULO
export {};