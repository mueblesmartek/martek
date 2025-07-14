// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  inStock: boolean;
  stockQuantity?: number;
  sku?: string;
  featured: boolean;
  isNew: boolean;
  rating?: number;
  reviewCount?: number;
  tags: string[];
  specifications?: Record<string, string>;
  variants?: {
    colors?: string[];
    sizes?: string[];
    materials?: string[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  search?: string;
  tags?: string[];
  sortBy?: 'price' | 'name' | 'rating' | 'newest' | 'featured';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color?: string;
  size?: string;
  material?: string;
  sku: string;
  price?: number;
  stockQuantity: number;
  images?: string[];
}

// src/types/order.ts
export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentId?: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  items: OrderItem[];
  tracking?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    currentStatus?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantInfo?: {
    color?: string;
    size?: string;
    sku?: string;
  };
}

export interface Address {
  id?: string;
  type?: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface OrderSummary {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  currency: string;
}

// src/types/cart.ts
export interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    sku?: string;
  };
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
}

export interface Cart {
  id?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  updatedAt: string;
  expiresAt?: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shippingEstimate: number;
  taxEstimate: number;
  total: number;
  currency: string;
  freeShippingThreshold?: number;
  freeShippingRemaining?: number;
}

// src/types/user.ts
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  emailVerified: boolean;
  marketingConsent: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  newsletterSubscription: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  productRecommendations: boolean;
  language: string;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionData: {
    cart?: Cart;
    recentlyViewed?: string[];
    preferences?: Partial<UserPreferences>;
    [key: string]: any;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// src/types/payment.ts
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: 'card' | 'pse' | 'nequi' | 'efecty' | 'bancolombia';
  customerId: string;
  orderId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  provider: 'wompi' | 'stripe' | 'paypal';
  details: {
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    accountType?: string;
    walletType?: string;
  };
  isDefault: boolean;
  userId: string;
  createdAt: string;
}

export interface WompiPayment {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    type: string;
    extra: Record<string, any>;
  };
  redirect_url: string;
  reference: string;
  created_at: string;
  finalized_at?: string;
}

// src/types/inventory.ts
export interface InventoryItem {
  id: string;
  productId: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityOnOrder: number;
  reorderLevel: number;
  maxStockLevel?: number;
  supplier?: string;
  costPrice?: number;
  lastRestocked?: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED' | 'TRANSFER';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  orderId?: string;
  userId?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'REORDER_NEEDED';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
}

// src/types/category.ts
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategoryId?: string;
  parentCategory?: Category;
  subcategories?: Category[];
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  facets?: string[];
}

// src/types/analytics.ts
export interface ProductAnalytics {
  productId: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  returnRate: number;
  averageRating: number;
  timeSpent: number;
  period: string;
}

export interface UserAnalytics {
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  favoriteCategory?: string;
  lifetimeValue: number;
  segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'lost';
}

export interface SalesAnalytics {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
  topCategories: Array<{
    category: string;
    revenue: number;
    orders: number;
  }>;
}

// src/types/notification.ts
export interface Notification {
  id: string;
  userId?: string;
  type: 'order' | 'payment' | 'shipping' | 'promotion' | 'system' | 'inventory';
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  scheduledAt?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'welcome' | 'order_confirmation' | 'shipping' | 'password_reset' | 'promotional';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// src/types/forms.ts
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  orderNumber?: string;
  category: 'general' | 'order' | 'product' | 'shipping' | 'return' | 'technical';
}

export interface NewsletterSignup {
  email: string;
  firstName?: string;
  preferences?: {
    promotions: boolean;
    newProducts: boolean;
    tips: boolean;
  };
  source?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  reported: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Tipos de utilidad
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Timestamps = {
  createdAt: string;
  updatedAt: string;
};

export type WithTimestamps<T> = T & Timestamps;