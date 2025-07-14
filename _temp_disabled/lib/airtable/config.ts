// src/lib/airtable/config.ts
import Airtable from 'airtable';

// Configuración de Airtable
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  throw new Error('Faltan variables de entorno de Airtable');
}

// Configurar Airtable
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY
});

// Base de datos principal
export const base = Airtable.base(AIRTABLE_BASE_ID);

// Nombres de las tablas
export const TABLES = {
  PRODUCTS: 'Products',
  ORDERS: 'Orders', 
  ORDER_ITEMS: 'Order_Items',
  INVENTORY: 'Inventory',
  CATEGORIES: 'Categories',
  BRANDS: 'Brands',
  CUSTOMERS: 'Customers', // Info básica, no sensible
  SHIPPING: 'Shipping_Info'
} as const;

// Configuración de campos por tabla
export const FIELDS = {
  PRODUCTS: {
    ID: 'ID',
    NAME: 'Name',
    DESCRIPTION: 'Description',
    PRICE: 'Price',
    ORIGINAL_PRICE: 'Original_Price',
    IMAGES: 'Images',
    CATEGORY: 'Category',
    SUBCATEGORY: 'Subcategory',
    BRAND: 'Brand',
    IN_STOCK: 'In_Stock',
    STOCK_QUANTITY: 'Stock_Quantity',
    SKU: 'SKU',
    FEATURED: 'Featured',
    IS_NEW: 'Is_New',
    RATING: 'Rating',
    REVIEW_COUNT: 'Review_Count',
    TAGS: 'Tags',
    SPECIFICATIONS: 'Specifications',
    VARIANTS: 'Variants',
    STATUS: 'Status',
    CREATED_AT: 'Created_At',
    UPDATED_AT: 'Updated_At'
  },
  
  ORDERS: {
    ID: 'Order_ID',
    CUSTOMER_EMAIL: 'Customer_Email', // Referencia a Supabase
    CUSTOMER_ID: 'Customer_ID', // UUID de Supabase
    STATUS: 'Status',
    PAYMENT_STATUS: 'Payment_Status',
    SUBTOTAL: 'Subtotal',
    SHIPPING_COST: 'Shipping_Cost',
    TAX_AMOUNT: 'Tax_Amount',
    TOTAL_AMOUNT: 'Total_Amount',
    CURRENCY: 'Currency',
    PAYMENT_METHOD: 'Payment_Method',
    PAYMENT_ID: 'Payment_ID', // Wompi transaction ID
    SHIPPING_ADDRESS: 'Shipping_Address',
    BILLING_ADDRESS: 'Billing_Address',
    NOTES: 'Notes',
    CREATED_AT: 'Created_At',
    UPDATED_AT: 'Updated_At'
  },
  
  ORDER_ITEMS: {
    ID: 'ID',
    ORDER_ID: 'Order_ID',
    PRODUCT_ID: 'Product_ID',
    PRODUCT_NAME: 'Product_Name',
    QUANTITY: 'Quantity',
    UNIT_PRICE: 'Unit_Price',
    TOTAL_PRICE: 'Total_Price',
    VARIANT_INFO: 'Variant_Info'
  },
  
  INVENTORY: {
    ID: 'ID',
    PRODUCT_ID: 'Product_ID',
    QUANTITY_AVAILABLE: 'Quantity_Available',
    QUANTITY_RESERVED: 'Quantity_Reserved',
    REORDER_LEVEL: 'Reorder_Level',
    SUPPLIER: 'Supplier',
    COST_PRICE: 'Cost_Price',
    LAST_RESTOCKED: 'Last_Restocked',
    LOCATION: 'Location'
  },
  
  CATEGORIES: {
    ID: 'ID',
    NAME: 'Name',
    SLUG: 'Slug',
    DESCRIPTION: 'Description',
    IMAGE: 'Image',
    PARENT_CATEGORY: 'Parent_Category',
    SORT_ORDER: 'Sort_Order',
    IS_ACTIVE: 'Is_Active'
  }
} as const;

// Estados de productos
export const PRODUCT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived'
} as const;

// Estados de órdenes
export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned'
} as const;

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially_Refunded'
} as const;

// Funciones de utilidad para Airtable
export const airtableUtils = {
  // Convertir registro de Airtable a objeto limpio
  cleanRecord: (record: any) => {
    return {
      id: record.id,
      ...record.fields,
      createdTime: record._rawJson?.createdTime,
    };
  },
  
  // Formatear datos para Airtable
  formatForAirtable: (data: Record<string, any>) => {
    const formatted: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formatted[key] = value;
      }
    });
    
    return formatted;
  },
  
  // Manejar errores de Airtable
  handleError: (error: any) => {
    console.error('Airtable Error:', error);
    
    if (error.statusCode === 401) {
      throw new Error('Error de autenticación con Airtable');
    } else if (error.statusCode === 403) {
      throw new Error('Sin permisos para acceder a Airtable');
    } else if (error.statusCode === 404) {
      throw new Error('Tabla o registro no encontrado en Airtable');
    } else if (error.statusCode === 422) {
      throw new Error('Datos inválidos para Airtable');
    } else {
      throw new Error(`Error de Airtable: ${error.message}`);
    }
  }
};

// Configuración de caché (opcional)
export const CACHE_CONFIG = {
  PRODUCTS_TTL: 5 * 60 * 1000, // 5 minutos
  CATEGORIES_TTL: 30 * 60 * 1000, // 30 minutos
  INVENTORY_TTL: 60 * 1000, // 1 minuto
} as const;