export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// ✅ TIPOS E INTERFACES
interface CreateOrderRequest {
  total: number;
  subtotal?: number;
  tax?: number;
  shipping_cost?: number;
  shipping_address: {
    full_name: string;
    email: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: any;
  items: Array<{
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  payment_method?: string;
  customer_notes?: string | null;
  status?: string;
  payment_status?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// ✅ FUNCIÓN PARA VALIDAR PRECIO
function validatePrice(price: any): number {
  const numPrice = typeof price === 'number' ? price : parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0 ? numPrice : 0;
}

// ✅ FUNCIÓN PARA FORMATEAR PRECIO
function formatPrice(price: number): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(validatePrice(price));
  } catch (error) {
    return `$${validatePrice(price).toLocaleString('es-CO')}`;
  }
}

// ✅ FUNCIÓN PARA GENERAR NÚMERO DE ORDEN
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MT${timestamp.slice(-8)}${random}`;
}

// ✅ VALIDACIÓN SIMPLE PARA TESTING
function validateOrderData(data: any): { isValid: boolean; errors: ValidationError[]; cleanData?: CreateOrderRequest } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({ field: 'root', message: 'Datos de orden requeridos' });
    return { isValid: false, errors };
  }

  const total = validatePrice(data.total);
  if (total <= 0) {
    errors.push({ field: 'total', message: 'Total debe ser mayor a 0' });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Para testing, crear datos mínimos
  const cleanData: CreateOrderRequest = {
    total,
    subtotal: total * 0.84,
    tax: total * 0.16,
    shipping_cost: 0,
    shipping_address: {
      full_name: 'Test User',
      email: 'test@test.com',
      phone: '3001234567',
      address_line_1: 'Test Address',
      city: 'Bogotá',
      state: 'Bogotá',
      postal_code: '110111',
      country: 'Colombia'
    },
    items: [{
      product_id: 'test-123',
      product_name: 'Test Product',
      price: total,
      quantity: 1,
      total: total
    }],
    payment_method: 'pending'
  };

  return { isValid: true, errors: [], cleanData };
}

// ✅ ENDPOINT PRINCIPAL SIMPLIFICADO
export const POST: APIRoute = async ({ request }) => {
  console.log('📦 POST /api/orders/create - Iniciando...');

  if (!supabase) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database not available',
      code: 'DATABASE_ERROR'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // ✅ PARSEAR DATOS
    let requestData;
try {
  const rawBody = await request.text();
  console.log('Raw body:', rawBody);
  
  if (!rawBody || rawBody.trim() === '') {
    throw new Error('Request body está vacío');
  }
  
  // ✅ DETECTAR SI ES FORMDATA O JSON
  if (rawBody.includes('Content-Disposition: form-data')) {
    // Es FormData - extraer el JSON del campo "data"
    console.log('📋 Detectado FormData');
    const match = rawBody.match(/name="data"[\s\S]*?\r?\n\r?\n([\s\S]*?)\r?\n------/);
    if (match && match[1]) {
      const jsonData = match[1].trim();
      console.log('📋 JSON extraído:', jsonData);
      requestData = JSON.parse(jsonData);
    } else {
      throw new Error('No se pudo extraer datos del FormData');
    }
  } else {
    // Es JSON directo
    console.log('📄 Detectado JSON directo');
    requestData = JSON.parse(rawBody);
  }
} catch (parseError) {
  console.error('❌ Error parseando datos:', parseError);
  const errorMessage = parseError instanceof Error ? parseError.message : 'Error de parsing';
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Datos inválidos',
    details: errorMessage,
    code: 'INVALID_DATA'
  }), { 
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}


    console.log('📋 Datos recibidos:', requestData);

    // ✅ VALIDAR DATOS
    const validation = validateOrderData(requestData);
    if (!validation.isValid) {
      console.error('❌ Datos inválidos:', validation.errors);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos de orden inválidos',
        validation_errors: validation.errors,
        code: 'VALIDATION_ERROR'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orderData = validation.cleanData!;

    // ✅ CREAR ORDEN EN SUPABASE
    const finalOrderData = {
      order_number: generateOrderNumber(),
      user_id: null,
      total: orderData.total,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      shipping_cost: orderData.shipping_cost,
      shipping_address: orderData.shipping_address,
      billing_address: orderData.shipping_address,
      items: orderData.items,
      payment_method: orderData.payment_method,
      customer_notes: orderData.customer_notes,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdOrder, error: createError } = await supabase
      .from('orders')
      .insert([finalOrderData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creando orden:', createError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error creando la orden en la base de datos',
        details: createError.message,
        code: 'DATABASE_ERROR'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Orden creada exitosamente:', createdOrder.order_number);

    // ✅ RESPUESTA EXITOSA
    return new Response(JSON.stringify({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        id: createdOrder.id,
        order_number: createdOrder.order_number,
        total: createdOrder.total,
        status: createdOrder.status,
        payment_status: createdOrder.payment_status,
        created_at: createdOrder.created_at
      }
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado al procesar tu pedido',
      details: errorMessage,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ✅ MÉTODO GET PARA VERIFICAR
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Endpoint de creación de órdenes activo',
    version: '3.0-simplified',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};