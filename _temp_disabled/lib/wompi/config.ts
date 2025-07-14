// src/lib/wompi/config.ts
import axios, { AxiosInstance } from 'axios';

// Configuración de Wompi
const WOMPI_BASE_URL = 'https://api.wompi.co/v1';
const WOMPI_PUBLIC_KEY = import.meta.env.PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_PRIVATE_KEY = import.meta.env.WOMPI_PRIVATE_KEY;
const WOMPI_EVENTS_SECRET = import.meta.env.WOMPI_EVENTS_SECRET;

if (!WOMPI_PUBLIC_KEY || !WOMPI_PRIVATE_KEY) {
  throw new Error('Faltan variables de entorno de Wompi');
}

// Cliente para APIs públicas (frontend)
export const wompiPublicClient: AxiosInstance = axios.create({
  baseURL: WOMPI_BASE_URL,
  headers: {
    'Authorization': `Bearer ${WOMPI_PUBLIC_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Cliente para APIs privadas (backend)
export const wompiPrivateClient: AxiosInstance = axios.create({
  baseURL: WOMPI_BASE_URL,
  headers: {
    'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Tipos de datos para Wompi
export interface WompiTransaction {
  id: string;
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    type: string;
    extra: Record<string, any>;
  };
  redirect_url: string;
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  created_at: string;
  finalized_at?: string;
  status_message?: string;
  shipping_address?: WompiAddress;
  payment_link_id?: string;
  payment_source_id?: string;
}

export interface WompiPaymentLink {
  id: string;
  created_at: string;
  status: 'OPEN' | 'EXPIRED' | 'DECLINED' | 'APPROVED';
  url: string;
  name: string;
  description: string;
  single_use: boolean;
  collect_shipping: boolean;
}

export interface WompiCustomer {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  legal_id?: string;
  legal_id_type?: string;
}

export interface WompiAddress {
  address_line_1: string;
  address_line_2?: string;
  country: string;
  region: string;
  city: string;
  name: string;
  phone_number: string;
  postal_code?: string;
}

export interface WompiPaymentMethod {
  type: 'CARD' | 'PSE' | 'BANCOLOMBIA_TRANSFER' | 'NEQUI' | 'BANCOLOMBIA_COLLECT';
  token?: string;
  installments?: number;
  extra?: {
    bin?: string;
    name?: string;
    brand?: string;
    exp_year?: string;
    exp_month?: string;
    last_four?: string;
    card_holder?: string;
    is_three_ds?: boolean;
    three_ds_auth?: {
      xid: string;
      cavv: string;
      eci: string;
      version: string;
      directory_response: string;
      authentication_response: string;
    };
  };
}

export interface CreateTransactionData {
  amount_in_cents: number;
  currency: 'COP';
  customer_email: string;
  payment_method: WompiPaymentMethod;
  redirect_url: string;
  reference: string;
  customer_data?: {
    full_name?: string;
    phone_number?: string;
    legal_id?: string;
    legal_id_type?: 'CC' | 'CE' | 'NIT' | 'PP';
  };
  shipping_address?: WompiAddress;
  payment_source_id?: string;
}

export interface CreatePaymentLinkData {
  name: string;
  description: string;
  single_use: boolean;
  amount_in_cents: number;
  currency: 'COP';
  customer_email: string;
  redirect_url: string;
  collect_shipping?: boolean;
  expires_at?: string;
  shipping_countries?: string[];
  payment_methods?: string[];
  reference?: string;
}

// Estados de transacción
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED', 
  DECLINED: 'DECLINED',
  ERROR: 'ERROR'
} as const;

// Tipos de métodos de pago
export const PAYMENT_METHODS = {
  CARD: 'CARD',
  PSE: 'PSE',
  BANCOLOMBIA_TRANSFER: 'BANCOLOMBIA_TRANSFER',
  NEQUI: 'NEQUI',
  BANCOLOMBIA_COLLECT: 'BANCOLOMBIA_COLLECT'
} as const;

// Tipos de identificación
export const LEGAL_ID_TYPES = {
  CC: 'CC', // Cédula de ciudadanía
  CE: 'CE', // Cédula de extranjería
  NIT: 'NIT', // Número de identificación tributaria
  PP: 'PP'  // Pasaporte
} as const;

// Configuración para diferentes ambientes
export const WOMPI_CONFIG = {
  production: {
    baseUrl: 'https://api.wompi.co/v1',
    widgetUrl: 'https://checkout.wompi.co/widget.js'
  },
  sandbox: {
    baseUrl: 'https://api.wompi.co/v1',
    widgetUrl: 'https://checkout.wompi.co/widget.js'
  }
} as const;

// Códigos de respuesta comunes
export const WOMPI_RESPONSE_CODES = {
  // Aprobadas
  '00': 'Transacción aprobada',
  '000': 'Transacción aprobada',
  
  // Rechazadas
  '05': 'Transacción rechazada',
  '51': 'Fondos insuficientes',
  '54': 'Tarjeta vencida',
  '57': 'Transacción no permitida',
  '61': 'Excede límite de retiro',
  '62': 'Tarjeta restringida',
  '65': 'Excede límite de transacciones',
  '75': 'Clave incorrecta',
  '91': 'Banco no disponible',
  '96': 'Error del sistema',
  
  // Errores de validación
  'INVALID_CARD': 'Tarjeta inválida',
  'INVALID_CVV': 'CVV inválido',
  'INVALID_EXPIRATION': 'Fecha de expiración inválida',
  'INVALID_AMOUNT': 'Monto inválido',
  'INVALID_CURRENCY': 'Moneda inválida'
} as const;

// Funciones de utilidad
export const wompiUtils = {
  // Convertir pesos a centavos
  pesosTocents: (pesos: number): number => {
    return Math.round(pesos * 100);
  },

  // Convertir centavos a pesos
  centsToPesos: (cents: number): number => {
    return cents / 100;
  },

  // Validar referencia única
  generateReference: (orderId: string): string => {
    const timestamp = Date.now();
    return `${orderId}_${timestamp}`;
  },

  // Validar email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validar monto
  isValidAmount: (amount: number): boolean => {
    return amount > 0 && amount <= 50000000; // Máximo 500,000 COP
  },

  // Formatear dirección para Wompi
  formatAddress: (address: any): WompiAddress => {
    return {
      address_line_1: `${address.streetAddress} ${address.apartment || ''}`.trim(),
      country: 'CO',
      region: address.state,
      city: address.city,
      name: `${address.firstName} ${address.lastName}`,
      phone_number: address.phone || '',
      postal_code: address.postalCode
    };
  },

  // Manejar errores de Wompi
  handleError: (error: any) => {
    console.error('Wompi Error:', error);

    if (error.response?.data?.error) {
      const wompiError = error.response.data.error;
      
      switch (wompiError.type) {
        case 'INPUT_VALIDATION_ERROR':
          throw new Error(`Error de validación: ${wompiError.messages?.join(', ')}`);
        case 'UNAUTHORIZED':
          throw new Error('Credenciales de Wompi inválidas');
        case 'PAYMENT_REQUIRED':
          throw new Error('Pago requerido');
        case 'NOT_FOUND':
          throw new Error('Transacción no encontrada');
        case 'UNPROCESSABLE_ENTITY':
          throw new Error('Datos de transacción inválidos');
        default:
          throw new Error(`Error de Wompi: ${wompiError.type}`);
      }
    }

    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Error de conexión con Wompi');
    }

    throw new Error(error.message || 'Error desconocido de Wompi');
  },

  // Verificar firma de webhook
  verifyWebhookSignature: (payload: string, signature: string): boolean => {
    if (!WOMPI_EVENTS_SECRET) return false;
    
    // Implementar verificación HMAC SHA256
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', WOMPI_EVENTS_SECRET)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  },

  // Generar URL de redirect
  generateRedirectUrl: (orderId: string, success: boolean = true): string => {
    const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    if (success) {
      return `${baseUrl}/checkout/confirmacion?orden=${orderId}&estado=exitoso`;
    } else {
      return `${baseUrl}/checkout/confirmacion?orden=${orderId}&estado=fallido`;
    }
  },

  // Obtener métodos de pago disponibles por monto
  getAvailablePaymentMethods: (amountInCents: number): string[] => {
    const methods = ['CARD', 'PSE'];
    
    // NEQUI disponible para montos menores a 3,000,000 COP
    if (amountInCents <= 300000000) {
      methods.push('NEQUI');
    }
    
    // Bancolombia Transfer disponible para montos menores a 5,000,000 COP  
    if (amountInCents <= 500000000) {
      methods.push('BANCOLOMBIA_TRANSFER');
    }
    
    return methods;
  },

  // Formatear datos de cliente
  formatCustomerData: (customerData: any) => {
    return {
      full_name: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
      phone_number: customerData.phone || '',
      legal_id: customerData.document || '',
      legal_id_type: customerData.documentType || 'CC'
    };
  }
};

// Configuración del widget de checkout
export const WIDGET_CONFIG = {
  currency: 'COP',
  amountInCents: 0, // Se establece dinámicamente
  reference: '', // Se establece dinámicamente
  publicKey: WOMPI_PUBLIC_KEY,
  redirectUrl: '', // Se establece dinámicamente
  taxInCents: {
    vat: 0, // Se calcula dinámicamente
    consumption: 0
  },
  customerData: {
    email: '',
    fullName: '',
    phoneNumber: '',
    legalId: '',
    legalIdType: 'CC'
  },
  shippingAddress: null,
  customization: {
    colors: {
      primary: '#f20530', // Color principal del proyecto
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444'
    },
    logo: '/images/logo-kama.svg',
    brandName: 'Kamasex.shop'
  }
} as const;

// Interceptores para logging y manejo de errores
wompiPublicClient.interceptors.request.use(
  (config) => {
    console.log('Wompi Public Request:', {
      method: config.method,
      url: config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Wompi Public Request Error:', error);
    return Promise.reject(error);
  }
);

wompiPublicClient.interceptors.response.use(
  (response) => {
    console.log('Wompi Public Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Wompi Public Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

wompiPrivateClient.interceptors.request.use(
  (config) => {
    console.log('Wompi Private Request:', {
      method: config.method,
      url: config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Wompi Private Request Error:', error);
    return Promise.reject(error);
  }
);

wompiPrivateClient.interceptors.response.use(
  (response) => {
    console.log('Wompi Private Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Wompi Private Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET };