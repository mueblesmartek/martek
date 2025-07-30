// src/lib/types.ts - ACTUALIZADO PARA MÚLTIPLES IMÁGENES

// ✅ TIPOS BÁSICOS
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;          // ✅ MANTENER por compatibilidad
  images?: ProductImage[] | null;     // ✅ NUEVO sistema múltiples imágenes
  category: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  slug?: string | null;
  featured: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id?: string | null;
  product_id: string;
  quantity: number;
  created_at: string;
  product_name: string;
  product_price: number;
  product_image?: string | null;
  product_category: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  total: number;
  status: string; // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shipping_address?: any; // jsonb
  items?: any; // jsonb
  created_at: string;
  order_number?: string | null;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  billing_address?: any; // jsonb
  payment_method?: string | null;
  payment_status: string; // 'pending' | 'completed' | 'failed' | 'refunded'
  payment_reference?: string | null;
  customer_notes?: string | null;
  admin_notes?: string | null;
  updated_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  full_name: string;
  email: string;                    // ✅ AGREGAR esta línea
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface BillingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  tax_id?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// ✅ TIPOS PARA MÚLTIPLES IMÁGENES
export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageValidation {
  isValid: boolean;
  errors: string[];
}

// ✅ FUNCIONES HELPER PARA IMÁGENES
export function getPrimaryImage(product: Product): ProductImage | null {
  // Buscar en el array de imágenes
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const primaryImage = product.images.find(img => img.isPrimary);
    if (primaryImage) return primaryImage;
    
    // Si no hay primary marcada, devolver la primera
    return product.images[0];
  }
  
  // Fallback a image_url
  if (product.image_url) {
    return {
      id: `legacy_${product.id}`,
      url: product.image_url,
      alt: product.name,
      isPrimary: true,
      sortOrder: 0
    };
  }
  
  return null;
}

export function getAllImages(product: Product): ProductImage[] {
  // Si tiene array de imágenes, usarlo
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  // Fallback a image_url
  if (product.image_url) {
    return [{
      id: `legacy_${product.id}`,
      url: product.image_url,
      alt: product.name,
      isPrimary: true,
      sortOrder: 0
    }];
  }
  
  // Fallback a placeholder
  return [{
    id: `placeholder_${product.id}`,
    url: '/images/placeholder-product.jpg',
    alt: product.name,
    isPrimary: true,
    sortOrder: 0
  }];
}

export function getPrimaryImageUrl(product: Product): string {
  const primaryImage = getPrimaryImage(product);
  
  if (primaryImage?.url) {
    return primaryImage.url;
  }
  
  // SVG placeholder inline - NO necesita archivo físico
  return 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f9fafb"/>
      <rect x="150" y="150" width="100" height="100" fill="#e5e7eb" rx="8"/>
      <text x="200" y="280" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="14">Sin imagen</text>
      <circle cx="180" cy="170" r="8" fill="#d1d5db"/>
      <path d="M165 195 L180 180 L195 195 L210 180 L225 210 L165 210 Z" fill="#d1d5db"/>
    </svg>
  `);
}

export function hasMultipleImages(product: Product): boolean {
  return getAllImages(product).length > 1;
}

export function validateProductImages(images: ProductImage[]): ImageValidation {
  const errors: string[] = [];
  
  if (images.length === 0) {
    return { isValid: true, errors: [] }; // Vacío es válido
  }
  
  // Verificar que hay al menos una imagen primary
  const primaryImages = images.filter(img => img.isPrimary);
  if (primaryImages.length === 0) {
    errors.push('Debe haber al menos una imagen marcada como principal');
  } else if (primaryImages.length > 1) {
    errors.push('Solo puede haber una imagen principal');
  }
  
  // Verificar IDs únicos
  const ids = images.map(img => img.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Los IDs de las imágenes deben ser únicos');
  }
  
  // Verificar URLs válidas
  images.forEach((img, index) => {
    if (!img.url || !img.url.trim()) {
      errors.push(`La imagen ${index + 1} no tiene URL válida`);
    }
    if (!img.id || !img.id.trim()) {
      errors.push(`La imagen ${index + 1} no tiene ID válido`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Cart Context Types
export interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

// Search and Filter Types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

export interface ProductSortOption {
  field: keyof Product;
  direction: 'asc' | 'desc';
  label: string;
}

// Payment Types (Wompi)
export interface WompiPaymentData {
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
  shipping_address?: ShippingAddress;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface NewsletterForm {
  email: string;
  preferences?: string[];
}

// Admin Types
export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  newOrdersToday?: number;
  topSellingProducts?: ProductWithSales[];
}

export interface ProductWithSales extends Product {
  total_sales: number;
  revenue: number;
}

// ✅ TIPOS ESPECÍFICOS PARA EL ADMIN SPREADSHEET
export interface ProductRowForAdmin extends Partial<Product> {
  tempId?: string;
  isNew?: boolean;
  isDirty?: boolean;
  errors?: Record<string, string>;
  originalImages?: ProductImage[]; // Para comparar cambios
}

// ✅ TIPOS PARA VALIDACIÓN
export interface ValidationError {
  field: string;
  message: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: ValidationError[];
}

// ✅ TIPOS PARA CSV IMPORT
export interface CSVProduct {
  name: string;
  price: number;
  category: string;
  stock: number;
  description?: string;
  image_url?: string;
}

// ✅ TIPOS PARA FORMULARIOS DE CHECKOUT
export interface CheckoutFormData {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'card' | 'pse' | 'nequi';
  termsAccepted: boolean;
  marketingAccepted: boolean;
  notes: string;
}

export interface CheckoutState {
  formData: CheckoutFormData;
  currentStep: number;
  errors: Record<string, string>;
  isLoading: boolean;
}

export interface CheckoutContextType {
  state: CheckoutState;
  updateField: (field: keyof CheckoutFormData, value: any) => void;
  setStep: (step: number) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  setLoading: (loading: boolean) => void;
  resetForm: () => void;
  validateStep: (step: number) => boolean;
  canProceedToStep: (step: number) => boolean;
}

export type CheckoutAction =
  | { type: 'UPDATE_FIELD'; payload: { field: keyof CheckoutFormData; value: any } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_FORM' };

// Database Types (Supabase) - Actualizados para coincidir con esquema real
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;          // ✅ MANTENER
          images: ProductImage[] | null;     // ✅ NUEVO
          category: string;
          stock: number;
          is_active: boolean;
          created_at: string;
          slug: string | null;
          featured: boolean;
          meta_title: string | null;
          meta_description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;         // ✅ MANTENER
          images?: ProductImage[] | null;    // ✅ NUEVO
          category: string;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          slug?: string | null;
          featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;         // ✅ MANTENER
          images?: ProductImage[] | null;    // ✅ NUEVO
          category?: string;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          slug?: string | null;
          featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string | null;
          product_id: string;
          quantity: number;
          created_at: string;
          product_name: string;
          product_price: number;
          product_image: string | null;
          product_category: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          product_id: string;
          quantity?: number;
          created_at?: string;
          product_name: string;
          product_price: number;
          product_image?: string | null;
          product_category: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          product_name?: string;
          product_price?: number;
          product_image?: string | null;
          product_category?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          total: number;
          status: string;
          shipping_address: any | null;
          items: any | null;
          created_at: string;
          order_number: string | null;
          subtotal: number;
          tax: number;
          shipping_cost: number;
          billing_address: any | null;
          payment_method: string | null;
          payment_status: string;
          payment_reference: string | null;
          customer_notes: string | null;
          admin_notes: string | null;
          updated_at: string;
          shipped_at: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          total: number;
          status?: string;
          shipping_address?: any | null;
          items?: any | null;
          created_at?: string;
          order_number?: string | null;
          subtotal?: number;
          tax?: number;
          shipping_cost?: number;
          billing_address?: any | null;
          payment_method?: string | null;
          payment_status?: string;
          payment_reference?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          updated_at?: string;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          total?: number;
          status?: string;
          shipping_address?: any | null;
          items?: any | null;
          created_at?: string;
          order_number?: string | null;
          subtotal?: number;
          tax?: number;
          shipping_cost?: number;
          billing_address?: any | null;
          payment_method?: string | null;
          payment_status?: string;
          payment_reference?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          updated_at?: string;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
      };
    };
  };
}

// ✅ CONSTANTES DE VALIDACIÓN
export const VALIDATION_RULES = {
  PRODUCT_NAME_MAX_LENGTH: 255,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
  CATEGORY_NAME_MAX_LENGTH: 100,
  PRICE_MIN_VALUE: 0.01,
  STOCK_MIN_VALUE: 0,
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  MAX_IMAGES_PER_PRODUCT: 5,
  MAX_IMAGE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
} as const;

// ✅ CONSTANTES DE ESTADO
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;
export type PaymentStatus = keyof typeof PAYMENT_STATUSES;